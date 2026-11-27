import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentSessionUser() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Ensure DB record exists in case user was created before the trigger was applied
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
      roles: true,
    },
  });

  if (dbUser) {
    return dbUser;
  }

  const email = user.email ?? `${user.id}@egamesbnsph.local`;
  const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "user";
  const username = `${baseName.toLowerCase()}_${user.id.slice(0, 6)}`;

  return prisma.user.create({
    data: {
      id: user.id,
      email,
      profile: {
        create: {
          username,
          displayName:
            (user.user_metadata?.display_name as string | undefined) ?? baseName,
          status: "ACTIVE",
        },
      },
      roles: {
        createMany: {
          data: [{ role: "BUYER" }, { role: "SELLER" }],
        },
      },
    },
    include: {
      profile: true,
      roles: true,
    },
  });
}
