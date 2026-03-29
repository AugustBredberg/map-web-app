import { supabase } from "@/lib/supabase";
import type { Customer, DbClient } from "@/lib/supabase";
import { CUSTOMER_FIELDS } from "@/lib/customers";
import { getOrgMembers } from "@/lib/members";

const PROJECT_OVERVIEW_FIELDS = [
  "project_id",
  "title",
  "project_status",
  "start_time",
  "customer_id",
  "customer_location_id",
  "customer_location:customer_locations!customer_location_id(name, address)",
  "project_assignees(user_id)",
].join(", ");

export type CustomerLocationSummary = {
  customer_location_id: string;
  name: string;
  address: string | null;
};

export type OverviewProject = {
  project_id: string;
  title: string;
  project_status: number | null;
  start_time: string | null;
  customer_id: string;
  customer_location_id: string;
  customer_location: { name: string; address: string | null } | null;
  project_assignees: { user_id: string }[] | null;
};

export type CustomerOverviewRow = {
  customer: Customer;
  locations: CustomerLocationSummary[];
  projects: {
    project_id: string;
    title: string;
    project_status: number | null;
    start_time: string | null;
    siteLabel: string;
    assigneeUserIds: string[];
    hoursByUserId: Map<string, number>;
  }[];
  stats: {
    projectCount: number;
    loggedHoursTotal: number;
  };
};

export type CustomerOverviewData = {
  customers: CustomerOverviewRow[];
  memberNames: Map<string, string>;
  orgTotals: {
    customerCount: number;
    projectCount: number;
    loggedHoursTotal: number;
  };
};

/** Sums hours per project and per user from time log rows (null hours treated as 0). */
export function aggregateHoursByProjectAndUser(
  entries: { project_id: string; user_id: string; hours: number | null }[],
): Map<string, Map<string, number>> {
  const byProject = new Map<string, Map<string, number>>();
  for (const e of entries) {
    const add = e.hours ?? 0;
    if (!byProject.has(e.project_id)) {
      byProject.set(e.project_id, new Map());
    }
    const byUser = byProject.get(e.project_id)!;
    byUser.set(e.user_id, (byUser.get(e.user_id) ?? 0) + add);
  }
  return byProject;
}

function siteLabelForProject(project: OverviewProject): string {
  const loc = project.customer_location;
  if (!loc) return "";
  return (loc.name?.trim() || loc.address?.trim() || "").trim();
}

export async function fetchCustomerOverviewData(
  orgId: string,
  client: DbClient = supabase,
): Promise<{ data: CustomerOverviewData | null; error: string | null }> {
  const [{ data: customerRows, error: custErr }, { data: memberRows, error: memErr }] =
    await Promise.all([
      client
        .from("customers")
        .select(`${CUSTOMER_FIELDS}, customer_locations(customer_location_id, name, address)`)
        .eq("organization_id", orgId)
        .order("name"),
      getOrgMembers(orgId, client),
    ]);

  if (custErr) return { data: null, error: custErr.message };
  if (memErr) return { data: null, error: memErr };

  const memberNames = new Map<string, string>();
  for (const m of memberRows ?? []) {
    memberNames.set(
      m.user_id,
      (m.display_name && m.display_name.trim()) || m.user_id,
    );
  }

  const { data: projectRows, error: projErr } = await client
    .from("projects")
    .select(PROJECT_OVERVIEW_FIELDS)
    .eq("organization_id", orgId);

  if (projErr) return { data: null, error: projErr.message };

  const projects = (projectRows ?? []) as unknown as OverviewProject[];
  const projectIds = projects.map((p) => p.project_id);

  let hoursByProject = new Map<string, Map<string, number>>();
  if (projectIds.length > 0) {
    const { data: logRows, error: logErr } = await client
      .from("project_time_log_entries")
      .select("project_id, user_id, hours")
      .in("project_id", projectIds);

    if (logErr) return { data: null, error: logErr.message };
    hoursByProject = aggregateHoursByProjectAndUser(logRows ?? []);
  }

  const projectsByCustomer = new Map<string, OverviewProject[]>();
  for (const p of projects) {
    const key = String(p.customer_id);
    if (!projectsByCustomer.has(key)) {
      projectsByCustomer.set(key, []);
    }
    projectsByCustomer.get(key)!.push(p);
  }

  type CustomerWithLocs = Customer & {
    customer_locations: CustomerLocationSummary[] | null;
  };

  const customers: CustomerOverviewRow[] = (customerRows ?? []).map((row: CustomerWithLocs) => {
    const customer: Customer = {
      customer_id: String(row.customer_id),
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      organization_id: row.organization_id,
      created_at: row.created_at,
    };

    const locations = row.customer_locations ?? [];
    const forCustomer = projectsByCustomer.get(customer.customer_id) ?? [];

    const mappedProjects = forCustomer.map((proj) => {
      const assignees = proj.project_assignees ?? [];
      const assigneeUserIds = [...new Set(assignees.map((a) => a.user_id))];
      const hoursMap = hoursByProject.get(proj.project_id) ?? new Map<string, number>();

      return {
        project_id: proj.project_id,
        title: proj.title ?? "",
        project_status: proj.project_status,
        start_time: proj.start_time,
        siteLabel: siteLabelForProject(proj),
        assigneeUserIds,
        hoursByUserId: new Map(hoursMap),
      };
    });

    mappedProjects.sort((a, b) => {
      const ta = a.start_time ? new Date(a.start_time).getTime() : 0;
      const tb = b.start_time ? new Date(b.start_time).getTime() : 0;
      return tb - ta;
    });

    let loggedHoursTotal = 0;
    for (const mp of mappedProjects) {
      for (const h of mp.hoursByUserId.values()) {
        loggedHoursTotal += h;
      }
    }

    return {
      customer,
      locations,
      projects: mappedProjects,
      stats: {
        projectCount: mappedProjects.length,
        loggedHoursTotal,
      },
    };
  });

  let orgProjectCount = 0;
  let orgLoggedHours = 0;
  for (const c of customers) {
    orgProjectCount += c.stats.projectCount;
    orgLoggedHours += c.stats.loggedHoursTotal;
  }

  return {
    data: {
      customers,
      memberNames,
      orgTotals: {
        customerCount: customers.length,
        projectCount: orgProjectCount,
        loggedHoursTotal: orgLoggedHours,
      },
    },
    error: null,
  };
}
