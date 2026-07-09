import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { CoreHomePage } from "../routes/CoreHomePage";
import { CityWorkspace } from "../modules/common/location/city";
import { CountryWorkspace } from "../modules/common/location/country";
import { DistrictWorkspace } from "../modules/common/location/district";
import { PincodeWorkspace } from "../modules/common/location/pincode";
import { StateWorkspace } from "../modules/common/location/state";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: CoreHomePage,
  getParentRoute: () => rootRoute,
  path: "/"
});

const coreRoute = createRoute({
  component: CountryWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core"
});

const countriesRoute = createRoute({
  component: CountryWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/common/location/countries"
});

const legacyCountriesRoute = createRoute({
  component: CountryWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/countries"
});

const statesRoute = createRoute({
  component: StateWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/common/location/states"
});

const districtsRoute = createRoute({
  component: DistrictWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/common/location/districts"
});

const citiesRoute = createRoute({
  component: CityWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/common/location/cities"
});

const pincodesRoute = createRoute({
  component: PincodeWorkspace,
  getParentRoute: () => rootRoute,
  path: "/core/common/location/pincodes"
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  coreRoute,
  countriesRoute,
  legacyCountriesRoute,
  statesRoute,
  districtsRoute,
  citiesRoute,
  pincodesRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
