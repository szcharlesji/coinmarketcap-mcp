import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Load environment variables
const API_KEY = process.env.COINMARKET_API_KEY;
if (!API_KEY) {
    throw new Error("Missing COINMARKET_API_KEY environment variable");
}
// Base CoinMarketCap API URL
const BASE_URL = "https://pro-api.coinmarketcap.com/v1";
// Create server instance
const server = new McpServer({
    name: "coinmarketcap",
    version: "1.0.0",
});
// Helper function for making CoinMarketCap API requests
async function makeApiRequest(endpoint, params = {}) {
    const headers = {
        "X-CMC_PRO_API_KEY": API_KEY,
        Accept: "application/json",
    };
    const url = new URL(`${BASE_URL}${endpoint}`);
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    });
    try {
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making CoinMarketCap API request:", error);
        return null;
    }
}
// Register cryptocurrency listings tool
server.tool("get-cryptocurrency-listings", "Get latest cryptocurrency listings with market data", {
    start: z.string().optional().describe("Offset (starting with 1)"),
    limit: z
        .string()
        .optional()
        .describe("Number of results (default: 100, max: 5000)"),
    sort: z
        .string()
        .optional()
        .describe("What to sort by (e.g., 'market_cap', 'volume_24h')"),
    sort_dir: z.string().optional().describe("Direction: 'asc' or 'desc'"),
    cryptocurrency_type: z
        .string()
        .optional()
        .describe("Filter by type (e.g., 'coins', 'tokens')"),
    convert: z
        .string()
        .optional()
        .describe("Currency to convert prices to (e.g., 'USD', 'EUR')"),
}, async (params) => {
    const defaultParams = {
        start: "1",
        limit: "100",
        convert: "USD",
        ...params,
    };
    const data = await makeApiRequest("/cryptocurrency/listings/latest", defaultParams);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve cryptocurrency listings",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Register cryptocurrency quotes tool
server.tool("get-cryptocurrency-quotes", "Get latest quotes for specific cryptocurrencies", {
    symbol: z
        .string()
        .optional()
        .describe("Comma-separated list of symbols (e.g., 'BTC,ETH')"),
    slug: z
        .string()
        .optional()
        .describe("Comma-separated list of slugs (e.g., 'bitcoin,ethereum')"),
    id: z
        .string()
        .optional()
        .describe("Comma-separated list of CoinMarketCap IDs"),
    convert: z
        .string()
        .optional()
        .describe("Currency to convert prices to (e.g., 'USD', 'EUR')"),
}, async (params) => {
    if (!params.symbol && !params.slug && !params.id) {
        return {
            content: [
                {
                    type: "text",
                    text: "Error: At least one of 'symbol', 'slug', or 'id' is required",
                },
            ],
        };
    }
    const defaultParams = {
        convert: "USD",
        ...params,
    };
    const data = await makeApiRequest("/cryptocurrency/quotes/latest", defaultParams);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve cryptocurrency quotes",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Register cryptocurrency map tool
server.tool("get-cryptocurrency-map", "Get mapping of all cryptocurrencies to CoinMarketCap IDs", {
    listing_status: z
        .string()
        .optional()
        .describe("Filter by status (e.g., 'active', 'inactive')"),
    start: z.string().optional().describe("Offset (starting with 1)"),
    limit: z
        .string()
        .optional()
        .describe("Number of results (default: 100, max: 5000)"),
    symbol: z
        .string()
        .optional()
        .describe("Filter by symbol(s) (comma-separated)"),
}, async (params) => {
    const defaultParams = {
        listing_status: "active",
        start: "1",
        limit: "100",
        ...params,
    };
    const data = await makeApiRequest("/cryptocurrency/map", defaultParams);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve cryptocurrency map",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Register cryptocurrency info tool
server.tool("get-cryptocurrency-info", "Get metadata for cryptocurrencies", {
    symbol: z
        .string()
        .optional()
        .describe("Comma-separated list of symbols (e.g., 'BTC,ETH')"),
    slug: z
        .string()
        .optional()
        .describe("Comma-separated list of slugs (e.g., 'bitcoin,ethereum')"),
    id: z
        .string()
        .optional()
        .describe("Comma-separated list of CoinMarketCap IDs"),
}, async (params) => {
    if (!params.symbol && !params.slug && !params.id) {
        return {
            content: [
                {
                    type: "text",
                    text: "Error: At least one of 'symbol', 'slug', or 'id' is required",
                },
            ],
        };
    }
    const data = await makeApiRequest("/cryptocurrency/info", params);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve cryptocurrency info",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Register global metrics tool
server.tool("get-global-metrics", "Get latest global cryptocurrency market metrics", {
    convert: z
        .string()
        .optional()
        .describe("Currency to convert prices to (e.g., 'USD', 'EUR')"),
}, async (params) => {
    const defaultParams = {
        convert: "USD",
        ...params,
    };
    const data = await makeApiRequest("/global-metrics/quotes/latest", defaultParams);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve global metrics",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Register exchange listings tool
server.tool("get-exchange-listings", "Get list of all exchanges with market data", {
    start: z.string().optional().describe("Offset (starting with 1)"),
    limit: z
        .string()
        .optional()
        .describe("Number of results (default: 100, max: 5000)"),
    sort: z
        .string()
        .optional()
        .describe("What to sort by (e.g., 'volume_24h')"),
    sort_dir: z.string().optional().describe("Direction: 'asc' or 'desc'"),
    market_type: z
        .string()
        .optional()
        .describe("Filter by market type (e.g., 'spot', 'derivatives')"),
    convert: z
        .string()
        .optional()
        .describe("Currency to convert prices to (e.g., 'USD', 'EUR')"),
}, async (params) => {
    const defaultParams = {
        start: "1",
        limit: "100",
        convert: "USD",
        ...params,
    };
    const data = await makeApiRequest("/exchange/listings/latest", defaultParams);
    if (!data) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve exchange listings",
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Run the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("CoinMarketCap MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
