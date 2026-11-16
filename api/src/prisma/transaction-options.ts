// Prisma gives an interactive transaction 2 seconds to start and 5 seconds to finish. Every query inside it is a
// round trip to the database, so over a slow connection (a phone hotspot, a database on another continent) that is
// not enough, and Prisma fails with P2028 "Transaction not found". These limits leave plenty of room.
export const TRANSACTION_TIMEOUTS = { maxWait: 10000, timeout: 30000 };
