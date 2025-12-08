"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebaseClient";

type HttpMethod = "GET" | "POST";

type PathParam = {
  name: string;
  label: string;
  placeholder?: string;
};

type ApiTestConfig = {
  id: string;
  title: string;
  description: string;
  method: HttpMethod;
  pathTemplate: string;
  pathParams?: PathParam[];
  defaultBody?: unknown;
  defaultQuery?: string;
};

type ApiResult = {
  status?: string;
  body?: string;
  error?: string;
};

const apiTests: ApiTestConfig[] = [
  {
    id: "targets-get",
    title: "List targets (GET)",
    description: "Fetch targets for the signed-in user with optional includeArchived flag.",
    method: "GET",
    pathTemplate: "/api/targets",
    defaultQuery: "includeArchived=true",
  },
  {
    id: "targets-post",
    title: "List targets (POST)",
    description: "Fetch targets using a JSON body for includeArchived.",
    method: "POST",
    pathTemplate: "/api/targets",
    defaultBody: { includeArchived: false },
  },
  {
    id: "target-archive",
    title: "Archive or unarchive target",
    description: "Toggle target archive state and cascade to actions.",
    method: "POST",
    pathTemplate: "/api/targets/[targetId]/archive",
    pathParams: [
      {
        name: "targetId",
        label: "Target ID",
        placeholder: "target-id",
      },
    ],
    defaultBody: { archived: true },
  },
  {
    id: "target-delete",
    title: "Delete target",
    description: "Soft-protected delete that requires mode: 'hard' for permanent removal.",
    method: "POST",
    pathTemplate: "/api/targets/[targetId]",
    pathParams: [
      {
        name: "targetId",
        label: "Target ID",
        placeholder: "target-id",
      },
    ],
    defaultBody: { mode: "hard" },
  },
  {
    id: "actions-list",
    title: "List actions",
    description: "Fetch actions for a target ordered by deadline.",
    method: "POST",
    pathTemplate: "/api/actions/list",
    defaultBody: { targetId: "target-id" },
  },
  {
    id: "actions-update",
    title: "Update action status",
    description: "Mark an action as pending or done.",
    method: "POST",
    pathTemplate: "/api/actions/update",
    defaultBody: { actionId: "action-id", status: "done" },
  },
  {
    id: "actions-delete",
    title: "Delete action",
    description: "Soft archive or hard delete an action.",
    method: "POST",
    pathTemplate: "/api/actions/delete",
    defaultBody: { actionId: "action-id", mode: "soft" },
  },
  {
    id: "generate-questions",
    title: "Generate questions",
    description: "Create discovery questions for a goal title.",
    method: "POST",
    pathTemplate: "/api/generate-questions",
    defaultBody: { userInput: "Grow my business" },
  },
  {
    id: "generate-smart",
    title: "Generate SMART guidance",
    description: "Produce SMART fields from a goal title and short answers.",
    method: "POST",
    pathTemplate: "/api/generate-smart",
    defaultBody: {
      userInput: "Grow my business",
      answers: [
        "I sell digital products",
        "I have repeat customers",
        "I need marketing help",
      ],
    },
  },
  {
    id: "generate-actions",
    title: "Generate starter actions",
    description: "Draft action plan items from SMART fields.",
    method: "POST",
    pathTemplate: "/api/generate-actions",
    defaultBody: {
      goalTitle: "Grow my business",
      smart: {
        specific: "Increase online sales",
        measurable: "Reach $5k/mo",
        achievable: "Use email campaigns",
        relevant: "Supports revenue goals",
        timeBased: "Within 90 days",
      },
    },
  },
  {
    id: "generate-more-actions",
    title: "Generate more actions",
    description: "Ask for additional actions based on existing list.",
    method: "POST",
    pathTemplate: "/api/generate-more-actions",
    defaultBody: {
      goalTitle: "Grow my business",
      smart: {
        specific: "Increase online sales",
        measurable: "Reach $5k/mo",
        achievable: "Use email campaigns",
        relevant: "Supports revenue goals",
        timeBased: "Within 90 days",
      },
      previousActions: [
        { title: "Set up email list", description: "Capture visitors" },
        { title: "Launch promo", description: "Offer discount" },
      ],
    },
  },
  {
    id: "save-goal",
    title: "Save goal data",
    description: "Create a target with SMART fields and initial actions.",
    method: "POST",
    pathTemplate: "/api/save-goal-data",
    defaultBody: {
      goalTitle: "Run a 5k",
      smart: {
        specific: "Run a 5k without stopping",
        measurable: "Finish under 35 minutes",
        achievable: "Train 3x weekly",
        relevant: "Improve health",
        timeBased: "Complete race in 10 weeks",
      },
      actions: [
        {
          title: "Follow couch-to-5k plan",
          description: "Train three times per week",
          frequency: "weekly",
          repeatConfig: { onDays: ["mon", "wed", "fri"] },
          userDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  },
];

function ApiTesterCard({ config }: { config: ApiTestConfig }) {
  const [bodyInput, setBodyInput] = useState(
    config.defaultBody ? JSON.stringify(config.defaultBody, null, 2) : ""
  );
  const [queryInput, setQueryInput] = useState(config.defaultQuery ?? "");
  const [pathValues, setPathValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (config.pathParams || []).forEach((param) => {
      initial[param.name] = "";
    });
    return initial;
  });
  const [result, setResult] = useState<ApiResult>({});
  const [isLoading, setIsLoading] = useState(false);

  const resolvedPath = useMemo(() => {
    return (config.pathParams || []).reduce((current, param) => {
      const replacement = pathValues[param.name]?.trim() || `[${param.name}]`;
      return current.replace(`[${param.name}]`, encodeURIComponent(replacement));
    }, config.pathTemplate);
  }, [config.pathParams, config.pathTemplate, pathValues]);

  async function runTest() {
    setIsLoading(true);
    setResult({});

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be signed in to call APIs.");
      }

      const token = await user.getIdToken();
      let url = resolvedPath;

      if (config.method === "GET" && queryInput.trim()) {
        const trimmedQuery = queryInput.trim();
        url += trimmedQuery.startsWith("?") ? trimmedQuery : `?${trimmedQuery}`;
      }

      const init: RequestInit = {
        method: config.method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (config.method !== "GET" && bodyInput.trim()) {
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(bodyInput);
        } catch (error) {
          throw new Error("Request body must be valid JSON.");
        }

        init.headers = {
          ...init.headers,
          "Content-Type": "application/json",
        };
        init.body = JSON.stringify(parsedBody);
      }

      const response = await fetch(url, init);
      const text = await response.text();

      let prettyBody = text || "(empty response)";
      try {
        prettyBody = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // keep raw text
      }

      setResult({
        status: `${response.status} ${response.statusText}`,
        body: prettyBody,
      });
    } catch (error: any) {
      setResult({ error: error?.message || "Unexpected error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">{config.method}</p>
          <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
          <p className="text-sm text-gray-600">{config.description}</p>
          <p className="mt-1 text-xs font-mono text-gray-500">{resolvedPath}</p>
        </div>
        <button
          type="button"
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={runTest}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Run"}
        </button>
      </div>

      {config.pathParams?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {config.pathParams.map((param) => (
            <label key={param.name} className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">{param.label}</span>
              <input
                type="text"
                value={pathValues[param.name]}
                onChange={(event) =>
                  setPathValues((prev) => ({ ...prev, [param.name]: event.target.value }))
                }
                placeholder={param.placeholder}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      ) : null}

      {config.method === "GET" ? (
        <label className="text-sm text-gray-700 block">
          <span className="block mb-1 font-medium">Query string (optional)</span>
          <input
            type="text"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="includeArchived=true"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </label>
      ) : (
        <label className="text-sm text-gray-700 block">
          <span className="block mb-1 font-medium">Request body (JSON)</span>
          <textarea
            value={bodyInput}
            onChange={(event) => setBodyInput(event.target.value)}
            rows={config.defaultBody ? 10 : 6}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          />
        </label>
      )}

      <div className="bg-gray-50 border rounded-lg p-3 space-y-1">
        <p className="text-sm font-semibold text-gray-800">Response</p>
        {result.status && (
          <p className="text-xs font-mono text-gray-600">Status: {result.status}</p>
        )}
        {result.error ? (
          <p className="text-sm text-red-600">{result.error}</p>
        ) : (
          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
            {result.body || "No response yet"}
          </pre>
        )}
      </div>
    </section>
  );
}

export default function ApiTesterPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-gray-600">Loading authentication...</div>;
  }

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">API tester</h1>
        <p className="text-gray-700">Sign in to send authenticated requests.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">API tester</h1>
        <p className="text-gray-700">
          Each card sends a request with your Firebase ID token so you can view the
          exact request/response pairs for every endpoint.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {apiTests.map((config) => (
          <ApiTesterCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}
