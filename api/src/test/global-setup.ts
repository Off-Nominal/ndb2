// Vitest global setup file
// This file runs once before all tests and configures the environment for testing

import { setup } from "./setup";

export default async function globalSetup() {
  await setup();
}
