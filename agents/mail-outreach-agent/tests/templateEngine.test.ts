import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  renderCampaignContent,
  validateTemplateTags,
  escapeHtml,
} from "../src/mail/templateEngine";

describe("templateEngine", () => {
  it("personalizes different leads from the same template", () => {
    const subjectTpl = "Quick question for {{first_name}} at {{company}}";
    const bodyTpl = "Hi {{first_name}},\nI saw you are {{current_title}} at {{company}}.";

    const lead1 = {
      first_name: "Alice",
      last_name: "Smith",
      full_name: "Alice Smith",
      company: "Acme Corp",
      current_title: "VP of Engineering",
    };

    const lead2 = {
      first_name: "Bob",
      last_name: "Jones",
      full_name: "Bob Jones",
      company: "Beta Tech",
      current_title: "Head of Product",
    };

    const result1 = renderCampaignContent(subjectTpl, bodyTpl, lead1);
    expect(result1.subject).toBe("Quick question for Alice at Acme Corp");
    expect(result1.bodyHtml).toBe("Hi Alice,\nI saw you are VP of Engineering at Acme Corp.");
    expect(result1.warnings.unknownTags).toEqual([]);

    const result2 = renderCampaignContent(subjectTpl, bodyTpl, lead2);
    expect(result2.subject).toBe("Quick question for Bob at Beta Tech");
    expect(result2.bodyHtml).toBe("Hi Bob,\nI saw you are Head of Product at Beta Tech.");
    expect(result2.warnings.unknownTags).toEqual([]);
  });

  it("falls back when a field is missing", () => {
    const templateWithFallback = "Hello {{first_name | there}}, welcome to {{company | your team}}!";
    const templateWithoutFallback = "Hello {{first_name}}, from {{company}}";

    const emptyLead = {
      first_name: null,
      company: undefined,
    };

    const resWithFallback = renderTemplate(templateWithFallback, emptyLead);
    expect(resWithFallback.rendered).toBe("Hello there, welcome to your team!");

    const resWithoutFallback = renderTemplate(templateWithoutFallback, emptyLead);
    expect(resWithoutFallback.rendered).toBe("Hello , from ");
  });

  it("flags unknown tags without deleting them", () => {
    const template = "Hi {{first_name}}, check out {{custom_promo_link}} at {{company}} with {{discount_code}}.";
    const lead = {
      first_name: "John",
      company: "Stripe",
    };

    const validation = validateTemplateTags(template);
    expect(validation.valid).toBe(false);
    expect(validation.unknownTags).toEqual(["custom_promo_link", "discount_code"]);

    const rendered = renderTemplate(template, lead);
    expect(rendered.rendered).toBe(
      "Hi John, check out {{custom_promo_link}} at Stripe with {{discount_code}}."
    );
    expect(rendered.warnings.unknownTags).toEqual(["custom_promo_link", "discount_code"]);

    const campaignResult = renderCampaignContent(
      "Offer for {{unrecognized_tag}}",
      "Body with {{first_name}} and {{another_bad_tag}}",
      lead
    );
    expect(campaignResult.subject).toBe("Offer for {{unrecognized_tag}}");
    expect(campaignResult.bodyHtml).toBe("Body with John and {{another_bad_tag}}");
    expect(campaignResult.warnings.unknownTags).toEqual(["unrecognized_tag", "another_bad_tag"]);
  });

  it("HTML-escapes lead-provided values", () => {
    const bodyTpl = "<p>Welcome {{full_name}} to {{company}}!</p>";
    const maliciousLead = {
      full_name: "<script>alert('pwned')</script>",
      company: "AT&T & \"Quotes\" 'Single'",
    };

    const result = renderCampaignContent("Safe Subject", bodyTpl, maliciousLead);
    expect(result.bodyHtml).toBe(
      "<p>Welcome &lt;script&gt;alert(&#39;pwned&#39;)&lt;/script&gt; to AT&amp;T &amp; &quot;Quotes&quot; &#39;Single&#39;!</p>"
    );
    expect(result.bodyHtml).not.toContain("<script>");

    expect(escapeHtml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});
