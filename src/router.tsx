import { AdminLayout } from "./components/layout/admin-layout";
import Claims from "./pages/claims";
import Dashboard from "./pages/dashboard";
import Jobs from "./pages/jobs";
import JobDetail from "./pages/jobs/detail";
import JobNew from "./pages/jobs/new";
import Login from "./pages/login";
import NotFound from "./pages/NotFound";
import Prices from "./pages/prices";
import Settlement from "./pages/settlement";
import Settings from "./pages/settings";
import Submit from "./pages/submit";
import Technicians from "./pages/technicians";

export const routers = [
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/submit/:token",
    name: "technician-submit",
    element: <Submit />,
  },
  {
    path: "/",
    name: "admin",
    element: <AdminLayout />,
    children: [
      {
        path: "/",
        name: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "/jobs",
        name: "jobs",
        element: <Jobs />,
      },
      {
        path: "/jobs/new",
        name: "job-new",
        element: <JobNew />,
      },
      {
        path: "/jobs/:id",
        name: "job-detail",
        element: <JobDetail />,
      },
      {
        path: "/claims",
        name: "claims",
        element: <Claims />,
      },
      {
        path: "/prices",
        name: "prices",
        element: <Prices />,
      },
      {
        path: "/technicians",
        name: "technicians",
        element: <Technicians />,
      },
      {
        path: "/settlement",
        name: "settlement",
        element: <Settlement />,
      },
      {
        path: "/settings",
        name: "settings",
        element: <Settings />,
      },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;