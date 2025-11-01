import { describe } from "vitest";

import { runPlanesVentaServiceIntegrationSuite } from "./planesVentaServiceScenarios";

describe(
  "planesVenta.service - integration",
  runPlanesVentaServiceIntegrationSuite
);
