/**
 * Airtable REST API Client
 * Syncs structured audio intelligence records to the user's Airtable Base.
 */

export interface AirtableRecordFields {
  "Title": string;
  "Summary": string;
  "Action Items / Questions": string;
  "Key Timestamps": string;
  "Audio Link"?: string;
  "WhipScribe Job ID": string;
}

export interface AirtableRecordResponse {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export class AirtableClient {
  private patToken: string;
  private baseId: string;
  private tableName: string;

  constructor(patToken?: string, baseId?: string, tableName?: string) {
    this.patToken = patToken || process.env.AIRTABLE_API_TOKEN || "";
    this.baseId = baseId || process.env.AIRTABLE_BASE_ID || "appx2rQXn4238eQ0v";
    this.tableName = tableName || process.env.AIRTABLE_TABLE_NAME || "Table 1";

    if (!this.patToken) {
      console.warn("AirtableClient initialized without AIRTABLE_API_TOKEN");
    }
  }

  private get headers(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.patToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Insert a new structured intelligence record into Airtable
   */
  async createRecord(fields: AirtableRecordFields): Promise<AirtableRecordResponse> {
    const encodedTable = encodeURIComponent(this.tableName);
    const url = `https://api.airtable.com/v0/${this.baseId}/${encodedTable}`;

    // Ensure Audio Link is not sent if empty string to avoid URL validation errors
    const sanitizedFields: Record<string, string> = {
      "Title": fields["Title"],
      "Summary": fields["Summary"],
      "Action Items / Questions": fields["Action Items / Questions"],
      "Key Timestamps": fields["Key Timestamps"],
      "WhipScribe Job ID": fields["WhipScribe Job ID"],
    };

    if (fields["Audio Link"] && fields["Audio Link"].trim()) {
      sanitizedFields["Audio Link"] = fields["Audio Link"].trim();
    }

    const res = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        fields: sanitizedFields,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Airtable API error (${res.status}): ${errText}`);
    }

    return res.json();
  }

  /**
   * Helper to generate a direct link to the record or base in Airtable
   */
  getBaseUrl(): string {
    return `https://airtable.com/${this.baseId}`;
  }
}
