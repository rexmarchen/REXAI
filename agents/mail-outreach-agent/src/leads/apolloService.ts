export interface ApolloContactItem {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  title?: string;
  email?: string;
  email_status?: string;
  organization_name?: string;
  organization?: { name?: string };
}

export interface ApolloSearchOptions {
  apiKey?: string;
  query?: string;
  page?: number;
  perPage?: number;
}

export interface NormalizedLead {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  source: string;
}

/**
 * Client for fetching saved/synced contacts from Apollo.io and normalizing
 * them for outreach campaigns and database imports.
 */
export class ApolloLeadService {
  private apiKey: string;
  private baseUrl = "https://api.apollo.io/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || "";
  }

  /**
   * Check if Apollo API credentials are valid and live.
   */
  async checkHealth(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.apiKey) {
      return { healthy: false, message: "APOLLO_API_KEY is not configured" };
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/health`, {
        headers: { "X-Api-Key": this.apiKey },
      });
      if (res.ok) {
        const body = (await res.json()) as { healthy?: boolean };
        return { healthy: Boolean(body.healthy) };
      }
      return { healthy: false, message: `Apollo health check returned status ${res.status}` };
    } catch (err: any) {
      return { healthy: false, message: err?.message || "Apollo health check failed" };
    }
  }

  /**
   * Search saved contacts from Apollo.io.
   */
  async searchContacts(options: ApolloSearchOptions = {}): Promise<ApolloContactItem[]> {
    const key = options.apiKey || this.apiKey;
    if (!key) {
      throw new Error("No Apollo API key provided");
    }

    const payload: Record<string, any> = {
      page: options.page || 1,
      per_page: options.perPage || 50,
    };
    if (options.query) {
      payload.q_keywords = options.query;
    }

    const res = await fetch(`${this.baseUrl}/contacts/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": key,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Apollo contacts/search failed:", { status: res.status, errText });
      throw new Error(`Apollo API error (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as { contacts?: ApolloContactItem[] };
    return data.contacts || [];
  }

  /**
   * Normalize an Apollo contact item into standard Lead fields for the mail outreach agent.
   */
  normalizeContact(contact: ApolloContactItem): NormalizedLead | null {
    if (!contact.email || !contact.email.includes("@")) {
      return null;
    }

    const firstName = contact.first_name || (contact.name ? contact.name.split(" ")[0] : "");
    const lastName = contact.last_name || (contact.name ? contact.name.split(" ").slice(1).join(" ") : "");
    const company = contact.organization_name || contact.organization?.name || "";
    const title = contact.title || "";

    return {
      email: contact.email.toLowerCase().trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      source: "apollo_api",
    };
  }
}
