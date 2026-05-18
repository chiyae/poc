import { relations } from "drizzle-orm/relations";
import { items, stocks, stockTakeSessions, stockTakeItems, priceHistory } from "./schema";

export const stocksRelations = relations(stocks, ({one}) => ({
	item: one(items, {
		fields: [stocks.itemId],
		references: [items.id]
	}),
}));

export const itemsRelations = relations(items, ({many}) => ({
	stocks: many(stocks),
	priceHistories: many(priceHistory),
}));

export const stockTakeItemsRelations = relations(stockTakeItems, ({one}) => ({
	stockTakeSession: one(stockTakeSessions, {
		fields: [stockTakeItems.sessionId],
		references: [stockTakeSessions.id]
	}),
}));

export const stockTakeSessionsRelations = relations(stockTakeSessions, ({many}) => ({
	stockTakeItems: many(stockTakeItems),
}));

export const priceHistoryRelations = relations(priceHistory, ({one}) => ({
	item: one(items, {
		fields: [priceHistory.itemId],
		references: [items.id]
	}),
}));