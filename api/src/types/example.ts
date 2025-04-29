import NDB2API from "@offnominal/ndb2-api-types";

export const example: NDB2API.Example = {
  id: "1",
  name: "Example",
  description: "This is an example.",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
