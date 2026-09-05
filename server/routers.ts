import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { deleteUserAccount, getAccountData, getSafetyPlan, updateCalculatorInputs, updateUserProfile, upsertSafetyPlan } from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  safetyPlan: router({
    get: protectedProcedure.query(({ ctx }) => getSafetyPlan(ctx.user.id)),
    save: protectedProcedure
      .input(z.object({ items: z.array(z.string().max(240)).max(20) }))
      .mutation(({ ctx, input }) => upsertSafetyPlan(ctx.user.id, input.items)),
  }),

  account: router({
    get: protectedProcedure.query(({ ctx }) => getAccountData(ctx.user.id)),
    profile: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120), workerType: z.string().trim().min(1).max(100) }))
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
    calculatorInputs: protectedProcedure
      .input(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
      .mutation(({ ctx, input }) => updateCalculatorInputs(ctx.user.id, input)),
    export: protectedProcedure.query(({ ctx }) => getAccountData(ctx.user.id)),
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await deleteUserAccount(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return result;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
