import type { Metadata } from "next";
import { BrandHeader } from "@/components/brand-header";
import { getProfile } from "@/lib/store";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle.toLowerCase());
  if (!profile) return { title: "Profile not found — ArcPay" };
  return {
    title: `${profile.name} — Pay with USDC`,
    description: profile.bio || "Accept USDC on Arc.",
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await getProfile(handle.toLowerCase());

  if (!profile) {
    return (
      <div className="flex flex-col flex-1 items-center px-5 py-8">
        <div className="w-full max-w-md">
          <BrandHeader compact showTag={false} />
          <div className="card-surface p-8 text-center">
            <h1 className="text-xl font-semibold">Profile not found</h1>
            <p className="mt-2 text-sm text-muted">
              This Pay Me link does not exist.
            </p>
            <a href="/" className="btn-primary mt-6 no-underline inline-flex items-center gap-2">
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center px-5 py-8">
      <div className="w-full max-w-md">
        <BrandHeader compact showTag={false} />
        <div className="card-surface p-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted">Accept USDC on Arc</p>
          {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}

          <div className="mt-6 space-y-2">
            {profile.presetAmounts.map((amt) => (
              <a
                key={amt}
                href={`/pay/${profile.handle}?amount=${amt}`}
                className="btn-secondary w-full no-underline"
              >
                Pay ${amt}
              </a>
            ))}
            <a
              href={`/pay/${profile.handle}?custom=1`}
              className="btn-primary w-full no-underline"
            >
              Custom amount
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
