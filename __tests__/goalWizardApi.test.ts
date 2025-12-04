import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { ActionSuggestion, FinalGoalPayload, SmartData, generateActions, generateQuestions, generateSmart, saveGoal } from "../lib/goalWizardApi.ts";

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type FetchCall = {
  url: string;
  init?: RequestInit;
};

let calls: FetchCall[] = [];

function setMockResponse(data: unknown, ok = true) {
  global.fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    calls.push({ url: typeof url === "string" ? url : url.toString(), init });
    const response: MockResponse = {
      ok,
      status: ok ? 200 : 500,
      json: async () => data,
    };
    return response as unknown as Response;
  };
}

function getLastBody() {
  const body = calls.at(-1)?.init?.body;
  return typeof body === "string" ? JSON.parse(body) : body;
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  // @ts-expect-error - cleaning up mock
  global.fetch = undefined;
});

describe("goalWizardApi", () => {
  it("sends goalTitle to generateQuestions", async () => {
    setMockResponse({ questions: ["Q1?", "Q2?", "Q3?"] });

    const questions = await generateQuestions("Grow revenue");

    assert.equal(questions.length, 3);
    const body = getLastBody();
    assert.equal(body.userInput, "Grow revenue");
  });

  it("maps SMART response timeBased to timebound", async () => {
    setMockResponse({
      goalTitle: "Grow revenue smart",
      smart: {
        specific: "S",
        measurable: "M",
        achievable: "A",
        relevant: "R",
        timeBased: "T",
      },
    });

    const result = await generateSmart("Grow revenue", ["answer"]);

    assert.equal(result.smart.timebound, "T");
    const body = getLastBody();
    assert.deepEqual(body.answers, ["answer"]);
  });

  it("maps SMART request into generateActions", async () => {
    const smart: SmartData = {
      specific: "S",
      measurable: "M",
      achievable: "A",
      relevant: "R",
      timebound: "T",
    };

    const actions: ActionSuggestion[] = [
      { title: "Do a thing", description: "desc", recommendedDeadline: "tomorrow" },
    ];

    setMockResponse({ actions });

    const result = await generateActions("Goal", smart);

    assert.equal(result[0]?.title, "Do a thing");
    const body = getLastBody();
    assert.equal(body.smart.timeBased, "T");
  });

  it("sends save payload with userId and timeBased", async () => {
    const payload: FinalGoalPayload = {
      uid: "user-1",
      createdAt: "2024-01-01T00:00:00.000Z",
      goalTitle: "Goal",
      questions: ["Q1"],
      smart: {
        specific: "S",
        measurable: "M",
        achievable: "A",
        relevant: "R",
        timebound: "T",
      },
      actions: [
        { title: "Act", deadline: "2024-02-02" },
      ],
    };

    setMockResponse({ success: true, targetId: "abc" });

    const response = await saveGoal(payload);

    assert.equal(response.success, true);
    const body = getLastBody();
    assert.equal(body.userId, "user-1");
    assert.equal(body.smart.timeBased, "T");
    assert.deepEqual(body.actions[0], { title: "Act", deadline: "2024-02-02" });
  });
});
