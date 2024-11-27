export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

interface PropertyFields {
  Address: string;
  "Post Code": string;
  "Property ID": string;
  "Owner ID": string[];
  "Tenant IDs": string[];
  "Next Due Date"?: string;
  "Reminder Date"?: string;
}

export interface Property extends AirtableRecord<PropertyFields> {
  fields: PropertyFields;
}

interface ContactFields {
  "First Name": string;
  "Last Name": string;
  "Mobile Number": string;
  "Landline Number"?: string;
  Email: string;
  Role: string;
  "Contact ID": string;
  Properties?: string[];
}

export interface Contact extends AirtableRecord<ContactFields> {
  fields: ContactFields;
}

interface ComplianceCheckFields {
  "Property ID": string[];
  Status: string;
  "Check ID": string;
  "Job Type": string[];
  "Inspection Date"?: string;
  "Inspection Month": string;
  "Inspection Year": number;
  "Notes"?: string;
  "AccessType"?: 'key' | 'tenant';
}

export interface ComplianceCheck extends AirtableRecord<ComplianceCheckFields> {
  fields: ComplianceCheckFields;
}

interface OwnershipChangeFields {
  "Property ID": string[];
  "Previous Owner": string[];
  "New Owner": string[];
  "Change Date": string;
  "Notes"?: string;
}

export interface OwnershipChange extends AirtableRecord<OwnershipChangeFields> {
  fields: OwnershipChangeFields;
} 