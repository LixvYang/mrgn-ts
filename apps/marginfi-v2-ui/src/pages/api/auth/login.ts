import { NextApiRequest, NextApiResponse } from "next";
import {
  createServerSupabaseClient,
  AuthPayload,
  verifySignature,
  generateCreds,
  LoginPayload,
} from "@mrgnlabs/mrgn-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServerSupabaseClient(req, res);
    const hasSignature = req.body.signature && req.body.signedMessage;

    if (hasSignature) {
      // Signature-based login
      const { walletAddress, signature, walletId }: AuthPayload = req.body;

      const signatureBytes = Buffer.from(signature, "base64");
      const isValidSignature = verifySignature(walletAddress, signatureBytes);

      if (!isValidSignature) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { email, password } = generateCreds(walletAddress, signature);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authData.user && walletId && walletId !== authData.user.user_metadata?.wallet_id) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            ...authData.user.user_metadata,
            wallet_id: walletId,
          },
        });

        if (updateError) {
          console.error("Failed to update user:", updateError);
          return res.status(500).json({ error: "Failed to update user" });
        }
      }

      if (authError || !authData.session) {
        console.error("Error authenticating user:", authError);
        return res.status(500).json({ error: "Failed to authenticate user" });
      }

      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });

      return res.status(200).json({
        user: {
          id: authData.user?.id,
          walletAddress,
          walletId: walletId || authData.user?.user_metadata?.wallet_id,
          referralCode: authData.user?.user_metadata?.referral_code,
          referredBy: authData.user?.user_metadata?.referred_by,
          lastLogin: authData.user?.last_sign_in_at,
        },
      });
    } else {
      // Regular login path (uses session if present)
      const { walletAddress, walletId }: LoginPayload = req.body;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(); // Will only work if setSession has been called previously

      if (userError || !user) {
        return res.status(401).json({
          error: "Authentication required",
          requiresSignature: true,
        });
      }

      if (user.user_metadata?.wallet_address !== walletAddress) {
        return res.status(403).json({ error: "Wallet mismatch" });
      }

      if (walletId && walletId !== user.user_metadata?.wallet_id) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            wallet_id: walletId,
          },
        });

        if (updateError) {
          console.error("Failed to update user:", updateError);
        }
      }

      return res.status(200).json({
        user: {
          id: user.id,
          walletAddress: user.user_metadata?.wallet_address,
          walletId: walletId || user.user_metadata?.wallet_id,
          referralCode: user.user_metadata?.referral_code,
          referredBy: user.user_metadata?.referred_by,
          lastLogin: user.last_sign_in_at,
        },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
