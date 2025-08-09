import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Database, Network, Boxes, Workflow } from "lucide-react";

export default function SystemBlueprint() {
  useEffect(() => {
    const title = "System Blueprint – DB and UI Architecture";
    const description =
      "Complete blueprint of the clinic & supplier platform: database schema, UI sitemap, and key flows.";
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", description);

    // Canonical
    const canonicalHref = `${window.location.origin}/blueprint`;
    let canonical = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // FAQ structured data
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is included in the system blueprint?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An overview of the architecture, database schema summary, UI sitemap per role, and key operational flows (AI analysis, images, billing, subscriptions).",
          },
        },
        {
          "@type": "Question",
          name: "How do I navigate to areas referenced here?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use the internal links to go directly to Patients, Appointments, Billing, Suppliers, and more.",
          },
        },
      ],
    };
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.text = JSON.stringify(faq);
    document.head.appendChild(jsonLd);

    return () => {
      if (jsonLd && jsonLd.parentNode) jsonLd.parentNode.removeChild(jsonLd);
    };
  }, []);

  const tables: Array<{ name: string; purpose: string; highlights: string[] }> = [
    {
      name: "profiles",
      purpose: "User profile and role mapping (dentist, assistant, supplier, super_admin)",
      highlights: [
        "RLS: users manage their own profile; super admins manage all",
        "Links users to a clinic via clinic_id",
      ],
    },
    {
      name: "clinics",
      purpose: "Clinic metadata, subscription status/plan",
      highlights: [
        "RLS: owners (by profile.clinic_id) can view/update",
        "Stores logo_url and settings",
      ],
    },
    {
      name: "patients",
      purpose: "Patient records per clinic",
      highlights: ["RLS by clinic_id", "Medical/dental history JSONB", "Active flag"],
    },
    {
      name: "appointments",
      purpose: "Scheduling and visit details",
      highlights: ["RLS by clinic_id", "duration/status/treatment type"],
    },
    {
      name: "treatments",
      purpose: "Treatment plans and completion",
      highlights: ["RLS by clinic_id", "cost, tooth_numbers, status"],
    },
    {
      name: "invoices",
      purpose: "Billing and payments",
      highlights: ["RLS by clinic_id", "tax/discount/paid_amount"],
    },
    {
      name: "medical_images",
      purpose: "X‑rays and media with annotations",
      highlights: ["RLS by clinic_id", "annotations/metadata JSONB", "patient and appointment links"],
    },
    {
      name: "subscriptions",
      purpose: "Plan, status, periods, amounts for clinics and suppliers",
      highlights: ["Policies for users, suppliers, super admins", "payment_method and stripe/FIB/local"],
    },
    {
      name: "suppliers",
      purpose: "Supplier companies and verification",
      highlights: ["Public view of active; owners manage own data", "payment accounts, ratings"],
    },
    {
      name: "products",
      purpose: "Supplier products catalog",
      highlights: ["Public view of active; suppliers manage own", "pricing, stock, specs"],
    },
  ];

  const SiteLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link to={to} className="text-blue-600 hover:underline dark:text-blue-400">
      {children}
    </Link>
  );

  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Blueprint</h1>
        <p className="text-muted-foreground mt-2">
          Database and UI architecture for the clinic and supplier platform.
        </p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Network className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Database
          </TabsTrigger>
          <TabsTrigger value="ui" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" /> UI Sitemap
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Flows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" /> High‑level Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The app is a React + Vite + Tailwind UI with Supabase for auth, database, storage, and edge
                functions. Role‑based navigation supports dentists, staff, suppliers, and super admins.
              </p>
              <ul className="list-disc ps-6 space-y-1">
                <li>Auth and profiles managed in Supabase with RLS.</li>
                <li>Clinic‑scoped data with strict RLS by clinic_id.</li>
                <li>Media storage in buckets (clinic logos, medical images).</li>
                <li>Edge functions for AI X‑ray analysis and payments.</li>
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">React 18</Badge>
                <Badge variant="secondary">Shadcn UI</Badge>
                <Badge variant="secondary">Supabase</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <div className="grid md:grid-cols-2 gap-4">
            {tables.map((t) => (
              <Card key={t.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{t.name}</span>
                    <Badge variant="outline">RLS Enabled</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t.purpose}</p>
                  <ul className="list-disc ps-6 mt-3 space-y-1">
                    {t.highlights.map((h) => (
                      <li key={h} className="text-sm">{h}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ui">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Dentist & Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><Check className="inline h-4 w-4 me-2" /> Home: <SiteLink to="/">Dashboard</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/patients">Patients</SiteLink>, <SiteLink to="/appointments">Appointments</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/treatments">Treatments</SiteLink>, <SiteLink to="/images">Medical Images</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/billing">Billing</SiteLink>, <SiteLink to="/reports">Reports</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/subscription">Subscription</SiteLink>, <SiteLink to="/settings">Settings</SiteLink></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Supplier</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/supplier-dashboard">Supplier Dashboard</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/supplier-inventory">Inventory</SiteLink>, <SiteLink to="/supplier-orders">Orders</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/supplier-payments">Pending Payments</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/supplier-settings">Payment & Subscription</SiteLink></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Super Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><Check className="inline h-4 w-4 me-2" /> <SiteLink to="/super-admin-dashboard">Overview</SiteLink></li>
                  <li><Check className="inline h-4 w-4 me-2" /> Users, Payments, Data, Clinics</li>
                  <li><Check className="inline h-4 w-4 me-2" /> Subscriptions, Reports, Settings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flows">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI X‑ray Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal ps-6 space-y-1 text-sm">
                  <li>Image stored in medical-images bucket with clinic scope.</li>
                  <li>Edge function analyze-xray fetches image (signed URL or storage path).</li>
                  <li>Base64 conversion, model inference, structured results returned.</li>
                  <li>UI shows progress and structured findings.</li>
                </ol>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline">Storage</Badge>
                  <Badge variant="outline">Edge Functions</Badge>
                  <Badge variant="outline">Secure Access</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Image Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal ps-6 space-y-1 text-sm">
                  <li>Canvas initialized with background image and drawing tools.</li>
                  <li>Annotations saved as JSONB on medical_images.annotations.</li>
                  <li>Undo/redo and non-destructive edits preserved per session.</li>
                </ol>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline">Fabric.js</Badge>
                  <Badge variant="outline">JSON Annotations</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing & Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal ps-6 space-y-1 text-sm">
                  <li>Invoices scoped by clinic_id with RLS.</li>
                  <li>Totals/discounts/taxes handled in invoices table.</li>
                  <li>PDF export and payment tracking in UI.</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscriptions & Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal ps-6 space-y-1 text-sm">
                  <li>Plans tracked in subscriptions with payment_method (FIB/local/stripe).</li>
                  <li>Supplier tiers via Supplier Subscription Tab; clinic plans via Subscription page.</li>
                  <li>Super admin approval flow for manual payments and FIB confirmations.</li>
                </ol>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline">RLS by role</Badge>
                  <Badge variant="outline">Manual + FIB</Badge>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/subscription">Clinic Subscription</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/supplier-settings">Supplier Subscription</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
