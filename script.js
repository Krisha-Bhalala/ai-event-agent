const examples = {
  student: {
    location: "Winnipeg, Manitoba",
    interests: "AI, machine learning, web development, React, Python",
    level: "intermediate",
    goals:
      "Find internship opportunities, network with companies, learn new technologies",
    budget: "free",
  },
  developer: {
    location: "Remote",
    interests: "Full-stack development, cloud computing, DevOps, JavaScript",
    level: "intermediate",
    goals: "Advance my career, learn best practices, meet other developers",
    budget: "low",
  },
  researcher: {
    location: "Winnipeg, Manitoba",
    interests:
      "Machine learning, data science, research, TensorFlow, academic papers",
    level: "advanced",
    goals:
      "Present my research, collaborate with academics, stay updated on latest research",
    budget: "medium",
  },
};

// Load example data into form
function loadExample(type) {
  const example = examples[type];
  document.getElementById("locationInput").value = example.location;
  document.getElementById("interestsInput").value = example.interests;
  document.getElementById("levelSelect").value = example.level;
  document.getElementById("goalsInput").value = example.goals;
  document.getElementById("budgetSelect").value = example.budget;
}

// Clear all form inputs and results
function clearAll() {
  document.getElementById("locationInput").value = "";
  document.getElementById("interestsInput").value = "";
  document.getElementById("levelSelect").value = "intermediate";
  document.getElementById("goalsInput").value = "";
  document.getElementById("budgetSelect").value = "free";
  document.getElementById("agentWorkflow").classList.remove("active");
  document.getElementById("workflowSteps").innerHTML = "";
  document.getElementById("finalResults").style.display = "none";
  document.getElementById("eventResults").innerHTML = "";
}

// Add a workflow step to the UI
function addWorkflowStep(id, title, description) {
  const stepsContainer = document.getElementById("workflowSteps");
  const stepDiv = document.createElement("div");
  stepDiv.className = "workflow-step";
  stepDiv.id = id;
  stepDiv.innerHTML = `
        <div class="step-icon">⏳</div>
        <div class="step-content">
            <div class="step-title">${title}</div>
            <div class="step-description">${description}</div>
        </div>
    `;
  stepsContainer.appendChild(stepDiv);
}

// Update workflow step status
function updateStepStatus(id, status, result = "") {
  const stepDiv = document.getElementById(id);
  if (!stepDiv) return;

  stepDiv.className = "workflow-step " + status;
  const icon = stepDiv.querySelector(".step-icon");

  if (status === "active") {
    icon.innerHTML = '<div class="step-loader"></div>';
  } else if (status === "completed") {
    icon.textContent = ":))";
    if (result) {
      const resultDiv = document.createElement("div");
      resultDiv.className = "step-result";
      resultDiv.textContent = result;
      stepDiv.querySelector(".step-content").appendChild(resultDiv);
    }
  } else if (status === "error") {
    icon.textContent = "❌";
  }
}

// Call AI API
async function callAI(systemPrompt, userPrompt) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `API Error: ${response.status}`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Main AI Agent function
async function runAgent() {
  // Check if API key is set up
  if (typeof API_KEY === "undefined" || API_KEY === "YOUR_GROQ_API_KEY_HERE") {
    alert("Please set up your API key in config.js");
    return;
  }

  // Get all input values
  const location = document.getElementById("locationInput").value.trim();
  const interests = document.getElementById("interestsInput").value.trim();
  const level = document.getElementById("levelSelect").value;
  const goals = document.getElementById("goalsInput").value.trim();
  const budget = document.getElementById("budgetSelect").value;

  // Validate inputs
  if (!location || !interests) {
    alert("Please fill in your location and interests");
    return;
  }

  // Show workflow area
  const workflowDiv = document.getElementById("agentWorkflow");
  workflowDiv.classList.add("active");
  document.getElementById("workflowSteps").innerHTML = "";
  document.getElementById("finalResults").style.display = "none";

  // Disable button
  const searchBtn = document.querySelector(".search-btn");
  searchBtn.disabled = true;

  const budgetMap = {
    free: "free events only",
    low: "events under $50",
    medium: "events under $200",
    any: "any budget",
  };

  try {
    // STEP 1: Analyze user profile
    addWorkflowStep(
      "step1",
      "Step 1: Analyzing your profile",
      "Understanding your interests and goals",
    );
    updateStepStatus("step1", "active");

    const profileAnalysis = await callAI(
      "You are a profile analyzer. Extract key skills, interests, and goals from user input.",
      `Analyze this profile and identify the top 3 most important interests/skills:

Location: ${location}
Interests: ${interests}
Level: ${level}
Goals: ${goals}
Budget: ${budgetMap[budget]}

Return ONLY a JSON object with this structure:
{
    "top_interests": ["interest1", "interest2", "interest3"],
    "primary_goal": "main goal",
    "event_types": ["type1", "type2"]
}`,
    );

    const profile = JSON.parse(
      profileAnalysis.replace(/```json|```/g, "").trim(),
    );
    updateStepStatus(
      "step1",
      "completed",
      `Identified: ${profile.top_interests.join(", ")}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // STEP 2: Generate search strategies
    addWorkflowStep(
      "step2",
      "Step 2: Creating search strategies",
      "Generating targeted search queries",
    );
    updateStepStatus("step2", "active");

    const searchStrategies = await callAI(
      "You are a search strategy generator for tech events.",
      `Based on this profile, generate 3 diverse search strategies to find events:

Top Interests: ${profile.top_interests.join(", ")}
Location: ${location}
Goal: ${profile.primary_goal}

Return ONLY a JSON array of 3 search queries:
["query1", "query2", "query3"]

Make queries specific and diverse (e.g., include hackathons, conferences, workshops).`,
    );

    const queries = JSON.parse(
      searchStrategies.replace(/```json|```/g, "").trim(),
    );
    updateStepStatus(
      "step2",
      "completed",
      `Created ${queries.length} search strategies`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // STEP 3: Find events for each query
    addWorkflowStep(
      "step3",
      "Step 3: Searching for events",
      `Running ${queries.length} searches across event databases`,
    );
    updateStepStatus("step3", "active");

    const allEvents = [];
    for (let i = 0; i < queries.length; i++) {
      const events = await callAI(
        "You are an event finder. Find 2-3 realistic tech events for 2026.",
        `Current date: January 10, 2026

Find 2-3 events matching: "${queries[i]}"
Location preference: ${location}
Budget: ${budgetMap[budget]}

Return ONLY a JSON array of events:
[{
    "name": "Event Name",
    "type": "hackathon/conference/workshop",
    "date": "Month Year",
    "cost": "price",
    "format": "in-person/virtual/hybrid",
    "description": "brief description"
}]`,
      );

      const parsedEvents = JSON.parse(
        events.replace(/```json|```/g, "").trim(),
      );
      allEvents.push(...parsedEvents);
    }

    updateStepStatus(
      "step3",
      "completed",
      `Found ${allEvents.length} potential events`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // STEP 4: Rank and filter events
    addWorkflowStep(
      "step4",
      "Step 4: Ranking events",
      "Scoring events based on your profile",
    );
    updateStepStatus("step4", "active");

    const rankedEvents = await callAI(
      "You are an event ranking system. Score events based on user fit.",
      `Score these events for this user (0-100):

User Profile:
- Interests: ${profile.top_interests.join(", ")}
- Goal: ${profile.primary_goal}
- Level: ${level}

Events:
${JSON.stringify(allEvents, null, 2)}

Return ONLY a JSON array with top 5 events, each with a match_score:
[{
    "name": "...",
    "type": "...",
    "date": "...",
    "cost": "...",
    "format": "...",
    "description": "...",
    "match_score": 85,
    "match_reason": "why it's a good fit"
}]

Sort by match_score descending.`,
    );

    const topEvents = JSON.parse(
      rankedEvents.replace(/```json|```/g, "").trim(),
    );
    updateStepStatus("step4", "completed", `Top 5 events selected`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // STEP 5: Generate application strategies
    addWorkflowStep(
      "step5",
      "Step 5: Creating application strategies",
      "Generating personalized tips for top events",
    );
    updateStepStatus("step5", "active");

    const strategies = await callAI(
      "You are an application strategy advisor for tech events.",
      `For these top 3 events, create specific application strategies:

User Profile:
- Level: ${level}
- Goal: ${profile.primary_goal}

Events:
${JSON.stringify(topEvents.slice(0, 3), null, 2)}

Return ONLY a JSON array:
[{
    "event_name": "...",
    "tips": ["tip1", "tip2", "tip3"]
}]`,
    );

    const applicationStrategies = JSON.parse(
      strategies.replace(/```json|```/g, "").trim(),
    );
    updateStepStatus(
      "step5",
      "completed",
      `Generated strategies for top events`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // STEP 6: Compile final report
    addWorkflowStep(
      "step6",
      "Step 6: Finalizing recommendations",
      "Preparing your personalized report",
    );
    updateStepStatus("step6", "active");

    // Merge strategies with events
    const finalEvents = topEvents.slice(0, 5).map((event) => {
      const strategy = applicationStrategies.find(
        (s) => s.event_name === event.name,
      );
      return {
        ...event,
        application_tips: strategy ? strategy.tips : [],
      };
    });

    updateStepStatus("step6", "completed", `Report ready!`);

    // Display final results
    displayFinalResults(finalEvents);
  } catch (error) {
    alert("Agent error: " + error.message);
    console.error(error);
  } finally {
    searchBtn.disabled = false;
  }
}

// Display final event recommendations
function displayFinalResults(events) {
  const resultsDiv = document.getElementById("finalResults");
  const eventsDiv = document.getElementById("eventResults");

  let html = "";
  events.forEach((event, index) => {
    html += `
            <div class="event-card">
                <h3>${index + 1}. ${event.name} <span class="match-score">${event.match_score}% Match</span></h3>
                <div class="event-detail"><strong>Type:</strong> ${event.type}</div>
                <div class="event-detail"><strong>Date:</strong> ${event.date}</div>
                <div class="event-detail"><strong>Cost:</strong> ${event.cost}</div>
                <div class="event-detail"><strong>Format:</strong> ${event.format}</div>
                <div class="event-detail"><strong>Description:</strong> ${event.description}</div>
                <div class="event-detail"><strong>Why it's a great fit:</strong> ${event.match_reason}</div>
                ${
                  event.application_tips && event.application_tips.length > 0
                    ? `
                    <div class="application-tips">
                        <h4>Application Strategy:</h4>
                        <ul>
                            ${event.application_tips.map((tip) => `<li>${tip}</li>`).join("")}
                        </ul>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  });

  eventsDiv.innerHTML = html;
  resultsDiv.style.display = "block";

  // Scroll to results
  resultsDiv.scrollIntoView({ behavior: "smooth" });
}
