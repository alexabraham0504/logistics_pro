# Implementation Plan - Logistics AI Assistant

## Goal Description
Implemented an AI-driven "Logistics Intelligence Hub" inspired by the "Agent Studio" screenshots.
This will be a dedicated section in the dashboard (`/dashboard/ai`) that mimics the premium, dark-mode "Orchestro" interface.
It will feature:
1.  **Agent Command Center**: A dashboard showing available AI Agents (e.g., "Fleet Optimizer", "Inventory Analyst", "Contract Intelligence").
2.  **Full-Screen Chat Interface**: A powerful chat UI to interact with these agents.
3.  **Document Intelligence Mode**: A specific split-view interface for the "Contract Agent" (Document on left, Chat on right).
4.  **Smart Tracking Visualization**: A premium "Tracking Agent" view featuring a dark-mode interactive map and vertical timeline for package journeys.
5.  **ZoneCast Analytics**: A "Zone Analytics Agent" with a heatmap visualization to show delivery zones and fee coverage.
6.  **Carrier Optimization Workflow**: A "Carrier Specialist" agent with a multi-phase proposal wizard (Phases 1-6) and savings analysis visualizations.
7.  **Market Lens (Clipped)**: A "Market Intelligence Agent" that aggregates industry news/articles into a card-based "Clipped" interface.
8.  **Company Watch**: A detailed financial monitoring dashboard within Market Lens to track competitor stocks, P/E ratios, and volume trends as shown in the visuals.
9.  **Real-time Insights Dashboard**: Visual cards showing AI "System Status" and "Active Models".

## User Review Required
> [!NOTE]
> **Visual Style**: I will use a high-contrast dark theme (similar to the screenshots) for this specific section to give it that "premium AI" feel, even if the rest of the app is light/mixed.
>
> **Functionality**: The "Agents" will essentially be different "modes" of the same backend AI, initialized with different context (system prompts).

## Proposed Changes

### Backend (`/backend`)
#### [NEW] [ai.routes.js](file:///d:/logistics_project/backend/src/routes/ai.routes.js)
-   Post endpoint `/chat`: Accepts `agentId` (e.g., 'fleet', 'inventory') to tailor the response context.
-   Get endpoint `/agents`: Returns list of available agents and their status.

#### [NEW] [Ai.controller.js](file:///d:/logistics_project/backend/src/controllers/Ai.controller.js)
-   `processChat`: Switches context based on `agentId`.
    -   *Fleet Agent*: Focuses on driver status, vehicle location (mocked/simulated).
    -   *Tracking Agent*: Focuses on specific shipment IDs. Returns coordinate data and timeline events for visualization.
    -   *Zone Agent*: Focuses on "ZoneCast" requests. Returns heatmap data points for delivery fees/coverage.
    -   *Carrier Agent*: Focuses on "Optimization Proposals". Returns a structured 6-phase workflow with savings data and carrier mix stats.
    -   *Market Agent*: Focuses on "Market Lens". Returns:
        -   *Clipped*: Curated articles/news.
        -   *Company Watch*: Financial data (Stock price, Cap, P/E) and charts for specific entities (FedEx, UPS).
    -   *Inventory Agent*: Focuses on warehouse stock levels.
    -   *Contract Agent*: Focuses on analyzing uploaded documents (simulated "expiry date checking" and "rates" extraction).
    -   *Support Agent*: General help.

#### [MODIFY] [server.js](file:///d:/logistics_project/backend/src/server.js)
-   Register `/api/ai` routes.

### Frontend (`/frontend`)
#### [NEW] [AiDashboard.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/page.tsx)
-   Main entry point for the AI section.
-   Layout similar to the screenshot: "Dashboard" overview with "Recent Agents" and stats.

#### [NEW] [TrackingMap.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/components/TrackingMap.tsx)
-   A specialized component for the "Tracking Agent".
-   Displays a dark-themed map (using mock coordinates or a library like `leaflet` if requested, otherwise CSS-based mock for now).
-   **Timeline Overlay**: A vertical list of events (Picked Up -> In Transit -> Delivered) with timestamps.
-   **Visual Style**: Neon path lines, pulsing current location dot.

#### [NEW] [ZoneHeatmap.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/components/ZoneHeatmap.tsx)
-   A specialized component for the "Zone Agent".
-   Displays a map (similar to TrackingMap but focused on regions) overlayed with a customized heatmap layer (using canvas or simplified CSS grid for now).
-   **Data Points**: Mocked data for "DAS/EDAS Coverage".

#### [NEW] [CarrierProposal.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/components/CarrierProposal.tsx)
-   A specialized component for the "Carrier Agent".
-   **Workflow Stepper**: Visual progress bar for "Phases" (1-6).
-   **Optimization Map**: Map showing hub-to-destination connections (curved lines).
-   **Stats Panel**: "Zone 0 Savings" and "Carrier Mix" charts detailed in the screenshots.

#### [NEW] [MarketLens.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/components/MarketLens.tsx)
-   A specialized component for the "Market Agent".
-   **Views**:
    -   **News Feed**: "Clipped" article cards in a carousel.
    -   **Company Grid**: Selector for companies to watch (FedEx, UPS, etc.).
    -   **Financial Dashboard**: Detailed view for a selected company showing Stock Price, Market Cap, P/E Ratio cards, and "Price/Volume Trend" charts.

#### [NEW] [AgentChat.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/agent/[id]/page.tsx)
-   The actual chat interface.
-   **Dynamic Layout**:
    -   If `id === 'contract'`, render a **Split View** (Doc + Chat).
    -   If `id === 'tracking'`, render a **Map View** board with the Chat overlay.
    -   If `id === 'zone'`, render a **Heatmap View** with the Chat overlay.
    -   If `id === 'carrier'`, render a **Proposal Wizard** view with the Chat overlay.
    -   If `id === 'market'`, render the **Market Lens** (News + Financials) view.
    -   Otherwise, render the standard specialized Full-Screen Chat.
-   Bubbles, input area, "Thinking..." states.

#### [NEW] [AiComponents.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/ai/components/AiComponents.tsx)
-   `AgentCard`: Displays agent info (Name, Model, Status).
-   `StatCard`: Displays metrics (Executions, Active Models).
-   `Sidebar`: Navigation for the AI section.

#### [NEW] [ai.module.css](file:///d:/logistics_project/frontend/src/app/dashboard/ai/ai.module.css)
-   Dark mode variables, glassmorphism classes, neon accents.

#### [MODIFY] [layout.tsx](file:///d:/logistics_project/frontend/src/app/dashboard/layout.tsx)
-   Add "AI Intelligence" link to the main sidebar.

## Verification Plan

### Manual Verification
1.  **Start Backend & Frontend**: Run `npm run dev` in both folders.
2.  **Open Dashboard**: Navigate to `/dashboard`.
3.  **Navigate to AI Hub**: Click the new "AI Intelligence" link.
4.  **Explore**:
    -   Verify the dashboard looks like the "Agent Studio" screenshots (dark, premium).
    -   Click on "Fleet Optimizer" agent.
    -   Chat with it: "Where are my trucks?"
    -   Verify it responds with data from the `Driver`/`Vehicle` collection.
4.  **Responsive Check**: Ensure the chat widget works on mobile (doesn't block critical UI).
