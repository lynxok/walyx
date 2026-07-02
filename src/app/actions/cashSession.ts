"use server";

import { db } from "@/lib/db";

export type CashSessionWithTransactions = {
  id: string;
  tenantId: string;
  openedBy: string;
  closedBy: string | null;
  openedAt: Date;
  closedAt: Date | null;
  openingBalance: number;
  expectedBalance: number;
  actualBalance: number | null;
  difference: number | null;
  status: string;
  notes: string | null;
  transactions: {
    id: string;
    sessionId: string;
    type: string;
    amount: number;
    category: string;
    notes: string | null;
    createdAt: Date;
  }[];
};

// 1. Get the current active session
export async function getActiveCashSession(tenantId: string): Promise<{ success: boolean; data: CashSessionWithTransactions | null; error?: string }> {
  try {
    const session = await db.cashSession.findFirst({
      where: {
        tenantId,
        status: "OPEN",
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return { success: true, data: session as any };
  } catch (error: any) {
    console.error("Error getting active cash session:", error);
    return { success: false, data: null, error: "Error al obtener la sesión de caja activa." };
  }
}

// 2. Open a new cash session
export async function openCashSession(
  tenantId: string,
  openingBalance: number,
  openedBy: string = "Cajero"
): Promise<{ success: boolean; data: any; error?: string }> {
  try {
    // Check if there is already an open session
    const existing = await db.cashSession.findFirst({
      where: {
        tenantId,
        status: "OPEN",
      },
    });

    if (existing) {
      throw new Error("Ya existe una sesión de caja abierta. Debe cerrarla antes de abrir una nueva.");
    }

    // Create session and opening balance transaction atomically
    const session = await db.cashSession.create({
      data: {
        tenantId,
        openedBy,
        openingBalance,
        expectedBalance: openingBalance,
        status: "OPEN",
        transactions: {
          create: {
            type: "PAY_IN",
            amount: openingBalance,
            category: "FLOAT",
            notes: "Saldo inicial de apertura de caja",
          },
        },
      },
    });

    return { success: true, data: session };
  } catch (error: any) {
    console.error("Error opening cash session:", error);
    return { success: false, data: null, error: error.message || "Error al abrir la sesión de caja." };
  }
}

// 3. Register a transaction (PAY_IN or PAY_OUT)
export async function addCashTransaction(
  sessionId: string,
  type: "PAY_IN" | "PAY_OUT",
  amount: number,
  category: string,
  notes?: string
): Promise<{ success: boolean; data: any; error?: string }> {
  try {
    const session = await db.cashSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "OPEN") {
      throw new Error("La sesión de caja no existe o ya está cerrada.");
    }

    // Create the transaction
    const transaction = await db.cashTransaction.create({
      data: {
        sessionId,
        type,
        amount,
        category,
        notes: notes || null,
      },
    });

    // Update the expectedBalance in the session
    const factor = type === "PAY_IN" ? 1 : -1;
    await db.cashSession.update({
      where: { id: sessionId },
      data: {
        expectedBalance: {
          increment: amount * factor,
        },
      },
    });

    return { success: true, data: transaction };
  } catch (error: any) {
    console.error("Error registering cash transaction:", error);
    return { success: false, data: null, error: error.message || "Error al registrar el movimiento." };
  }
}

// 4. Close the cash session
export async function closeCashSession(
  sessionId: string,
  actualBalance: number,
  closedBy: string = "Cajero",
  notes?: string
): Promise<{ success: boolean; data: any; error?: string }> {
  try {
    const session = await db.cashSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "OPEN") {
      throw new Error("La sesión de caja no existe o ya está cerrada.");
    }

    const expectedBalance = session.expectedBalance;
    const difference = actualBalance - expectedBalance;

    const closedSession = await db.cashSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedBy,
        actualBalance,
        difference,
        notes: notes || null,
      },
    });

    return { success: true, data: closedSession };
  } catch (error: any) {
    console.error("Error closing cash session:", error);
    return { success: false, data: null, error: error.message || "Error al cerrar la sesión de caja." };
  }
}

// 5. Get closed sessions history
export async function getCashSessionHistory(tenantId: string): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const history = await db.cashSession.findMany({
      where: {
        tenantId,
        status: "CLOSED",
      },
      orderBy: {
        closedAt: "desc",
      },
      include: {
        transactions: true,
      },
    });

    return { success: true, data: history };
  } catch (error: any) {
    console.error("Error getting cash session history:", error);
    return { success: false, data: [], error: "Error al obtener el historial de cierres." };
  }
}
