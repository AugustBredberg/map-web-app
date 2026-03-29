import { describe, it, expect, vi } from "vitest";
import { updateCustomerContact, CUSTOMER_CONTACT_UPDATE_NO_MATCH } from "@/lib/customers";
import { mockClient } from "./mockClient";

const sampleCustomer = {
  customer_id: "90001",
  name: "Acme",
  phone: "+1",
  email: "a@b.co",
  notes: "Note",
  organization_id: "org-1",
  created_at: "2026-01-01",
};

describe("updateCustomerContact", () => {
  it("updates phone, email, notes and returns row", async () => {
    const client = mockClient({ data: sampleCustomer, error: null });
    const { data, error } = await updateCustomerContact(
      "90001",
      { phone: "  070  ", email: "", notes: "  x  " },
      client,
    );
    expect(error).toBeNull();
    expect(data).toEqual(sampleCustomer);
    expect(client.from).toHaveBeenCalledWith("customers");
    const chain = (client.from as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith({
      phone: "070",
      email: null,
      notes: "x",
    });
    expect(chain.eq).toHaveBeenCalledWith("customer_id", 90001);
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "denied" } });
    const { data, error } = await updateCustomerContact(
      "90001",
      { phone: null, email: null, notes: null },
      client,
    );
    expect(data).toBeNull();
    expect(error).toBe("denied");
  });

  it("returns NO_MATCH when zero rows updated", async () => {
    const client = mockClient({ data: null, error: null });
    const { data, error } = await updateCustomerContact(
      "90001",
      { phone: null, email: null, notes: null },
      client,
    );
    expect(data).toBeNull();
    expect(error).toBe(CUSTOMER_CONTACT_UPDATE_NO_MATCH);
  });
});
