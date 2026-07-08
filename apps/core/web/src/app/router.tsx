import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { CoreHomePage } from "../routes/CoreHomePage";
import { CountryPage } from "../modules/country/country.page";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: CoreHomePage,
  getParentRoute: () => rootRoute,
  path: "/"
});

const coreRoute = createRoute({
  component: CountryPage,
  getParentRoute: () => rootRoute,
  path: "/core"
});

const countriesRoute = createRoute({
  component: CountryPage,
  getParentRoute: () => rootRoute,
  path: "/core/countries"
});

const routeTree = rootRoute.addChildren([homeRoute, coreRoute, countriesRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
