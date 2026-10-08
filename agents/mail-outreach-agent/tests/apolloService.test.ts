import { describe, it, expect } from "vitest";
import { ApolloLeadService } from "../src/leads/apolloService";

describe("ApolloLeadService", () => {
  it("normalizes an Apollo contact into standard lead attributes", () => {
    const service = new ApolloLeadService("dummy_key");
    const rawContact = {
      id: "cont_123",
      first_name: "Sarah",
      last_name: "Connor",
      title: "CTO",
      email: "sarah@cyberdyne.com",
      organization_name: "Cyberdyne Systems",
    };

    const normalized = service.normalizeContact(rawContact);
    expect(normalized).toEqual({
      email: "sarah@cyberdyne.com",
      firstName: "Sarah",
      lastName: "Connor",
      company: "Cyberdyne Systems",
      title: "CTO",
      source: "apollo_api",
    });
  });

  it("handles fallback name splitting and organization object nesting", () => {
    const service = new ApolloLeadService("dummy_key");
    const rawContact = {
      name: "John Doe",
      title: "Software Engineer",
      email: "John.Doe@Company.org",
      organization: { name: "Acme Inc" },
    };

    const normalized = service.normalizeContact(rawContact);
    expect(normalized).toEqual({
      email: "john.doe@company.org",
      firstName: "John",
      lastName: "Doe",
      company: "Acme Inc",
      title: "Software Engineer",
      source: "apollo_api",
    });
  });

  it("returns null if contact has no valid email", () => {
    const service = new ApolloLeadService("dummy_key");
    const invalidContact = {
      first_name: "Ghost",
      email: "",
    };

    expect(service.normalizeContact(invalidContact)).toBeNull();
  });
});
