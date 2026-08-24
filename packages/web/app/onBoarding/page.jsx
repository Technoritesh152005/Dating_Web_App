"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { api } from "../../lib/api";
import { presignAndUpload } from "@/lib/uploadS3";
import { Card } from "@/components/user_interface/Card";
import { Button } from "@/components/user_interface/Button";
import { CameraCapture } from "@/components/cameraCapture";
import { ChoicePills } from "@/components/user_interface/ChoicePills";

import { StepProgress } from "@/components/user_interface/stepProgress";
import { Input } from "@/components/user_interface/Input";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Man" },
  { value: "FEMALE", label: "Woman" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "OTHER", label: "Other" },
];

const PROFESSION_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "BUSINESS", label: "Business" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "ARTIST", label: "Artist" },
  { value: "OTHER", label: "Other" },
];

const LOOKING_FOR_OPTIONS = [
  { value: 'LONG_TERM_RELATIONSHIP', label: 'Long-term relationship' },
  { value: 'SERIOUS_RELATIONSHIP', label: 'Serious relationship' },
  { value: 'CASUAL_DATING', label: 'Casual dating' },
  { value: 'FRIENDSHIP', label: 'Friendship' },
  { value: 'NEW_CONNECTIONS', label: 'New connections' },
  { value: 'OPEN_TO_ANYTHING', label: 'Open to anything' },
  { value: 'NOT_SURE_YET', label: 'Not sure yet' },
  { value: 'JUST_CHAT', label: 'Just chatting' },
  { value: 'TRAVEL_BUDDY', label: 'Travel buddy' },
  { value: 'GAMING_BUDDY', label: 'Gaming buddy' },
  { value: 'ACTIVITY_PARTNER', label: 'Activity partner' },
  { value: 'COFFEE_DATE', label: 'Coffee & conversation' },
  { value: 'FREE_TONIGHT', label: 'Free tonight' },
];

const INTEREST_OPTIONS = [
  "Travel",
  "Music",
  "Cricket",
  "Football",
  "Basketball",
  "Tennis",
  "Badminton",
  "Cooking",
  "Baking",
  "Reading",
  "Fitness",
  "Running",
  "Yoga",
  "Cycling",
  "Movies",
  "TV Shows",
  "Anime",
  "Trekking",
  "Hiking",
  "Photography",
  "Art",
  "Dancing",
  "Gaming",
  "Board Games",
  "Technology",
  "Coding",
  "Startups",
  "Entrepreneurship",
  "Writing",
  "Poetry",
  "Fashion",
  "Shopping",
  "Food",
  "Coffee",
  "Tea",
  "Street Food",
  "Restaurants",
  "Pets",
  "Dogs",
  "Cats",
  "Nature",
  "Beach",
  "Mountains",
  "Camping",
  "Adventure",
  "Road Trips",
  "Cars",
  "Motorcycles",
  "Volunteering",
  "Meditation",
  "Self Improvement",
  "Podcasts",
  "Concerts",
  "Festivals",
  "Theatre",
  "Comedy",
  "Painting",
  "Crafts",
  "DIY",
  "Languages",
  "History",
  "Science",
  "Business",
  "Finance",
  "Investing",
  "Spirituality",
  "Socializing",
  "Nightlife",
  "Parties",
  "Karaoke",
].map((i) => ({ value: i, label: i }));

const totalSteps = 5;

export default function onBoardingSteps() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [complete, setComplete] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    interests: [],
    profession: "",
    lookingFor:[],
  });
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationRequesting, setLocationRequesting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((previewUrl) =>
        URL.revokeObjectURL(previewUrl),
      );
    };
  }, []);

  useEffect(() => {
    if (loading) return true;
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has verificationRequired flag from authContext (403 VERIFICATION_REQUIRED)
    if (user.verificationRequired) {
      // User is authenticated but not verified - show verification status
      setVerificationSubmitted(true);
      setComplete(true);
      setCheckingProfile(false);
      return;
    }

    const profile = user.profile;
    const status = profile?.verificationStatus;
    if (status === "VERIFIED" || status === "UNDER_REVIEW") {
      setComplete(true);
    } else if (status === "REVERIFICATION_REQUIRED" || status === "REJECTED") {
      setVerificationSubmitted(true);
      setComplete(true);
    } else {
      setComplete(false);
    }
    setCheckingProfile(false);
  }, [loading, user, router]);

  const updateForm = (fields) => setForm((f) => ({ ...f, ...fields }));

  const submitBasicInfo = async () => {
    setStep(1);
  };

  const submitAboutAndCreateProfile = async () => {
    setError(null);
    if (!form.profession) {
      setError("Please select your profession before continuing");
      return;
    }
    setSaving(true);
    try {
      await api.put("/profile", {
        displayName: form.displayName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bio: form.bio,
        interests: form.interests,
        lookingFor: form.lookingFor,
        profession: form.profession,
      });

      await api.put('/preferences',{
        lookingFor:form.lookingFor
      })
      setStep(2);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const requestAndSaveLocation = () => {
    setLocationError(null);
    setLocationRequesting(true);

    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
      setLocationRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.put("/profile/location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationPromptOpen(false);
          await refetch();
          router.push("/discover");
        } catch (err) {
          setLocationError(err.message || "Could not save your location.");
        } finally {
          setLocationRequesting(false);
        }
      },
      (geolocationError) => {
        setLocationError(
          geolocationError.code === 1
            ? "Location permission was denied. You can enable it in your browser settings."
            : "We could not get your current location. Please try again.",
        );
        setLocationRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const continueWithoutLocation = () => {
    setLocationPromptOpen(false);
    router.push("/discover");
  };

  const startVerificationAgain = () => {
    setError(null);
    setLocationError(null);
    setLocationPromptOpen(false);
    setVerificationSubmitted(false);
    setComplete(false);
    setStep(2);
  };

  useEffect(() => {
    const status = user?.profile?.verificationStatus || user?.verificationStatus;
    const hasLocation = user?.profile?.latitude != null && user?.profile?.longitude != null;
    if (status === "VERIFIED" && !hasLocation) {
      setLocationPromptOpen(true);
    }
  }, [user]);

  useEffect(() => {
    const status = user?.profile?.verificationStatus;
    if (!verificationSubmitted || status !== "UNDER_REVIEW") return undefined;

    const checkVerification = async () => {
      const refreshedUser = await refetch();
      const refreshedProfile = refreshedUser?.profile;
      if (
        refreshedProfile?.verificationStatus === "VERIFIED" &&
        (refreshedProfile.latitude == null || refreshedProfile.longitude == null)
      ) {
        setLocationPromptOpen(true);
      }
    };

    const intervalId = window.setInterval(() => {
      checkVerification().catch(() => {});
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [refetch, user, verificationSubmitted]);

  const handlePhotoSelect = async (fileList) => {
    setError(null);
    setUploadingPhotos(true);
    // Array.from() takes something that is iterable or array-like and creates a real JavaScript array from it.
    const files = Array.from(fileList).slice(0, 6 - photos.length);
    /* we try to upload one and one file / photo to s3 */
    try {
      for (const [index, file] of files.entries()) {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        setPhotos((p) => [...p, { key: `local-${previewUrl}`, previewUrl }]);
        try {
          const { key, publicUrl } = await presignAndUpload({
            file,
            presignPath: "/media/photos/presign",
            confirmPath: "/media/photos/confirm",
            extraConfirmFields: {
              isPrimary: photos.length === 0 && index === 0,
            },
          });
          setPhotos((p) =>
            p.map((photo) =>
              photo.previewUrl === previewUrl
                ? { ...photo, key, publicUrl }
                : photo,
            ),
          );
        } catch (err) {
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current.delete(previewUrl);
          setPhotos((p) =>
            p.filter((photo) => photo.previewUrl !== previewUrl),
          );
          setError(err.message);
        }
      }
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitVerification = async () => {
    setError(null);
    setSaving(true);

    try {
      const { key: selfieUploadKey } = await presignAndUpload({
        file: selfieFile,
        presignPath: "/media/selfie/presign",
      });
      await api.post("/verification/selfie", { selfieKey: selfieUploadKey });
      setVerificationSubmitted(true);
      setComplete(true);
      await refetch();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || checkingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">
          Loading…
        </p>
      </main>
    );
  }

  if (complete) {
    const status =
      user?.profile?.verificationStatus || user?.verificationStatus;

    // Determine message based on verification status
    let statusMessage = "Discovery feed comes next.";
    let statusTitle = "Profile created";

    if (status === "UNDER_REVIEW") {
      statusTitle = "Verification under review";
      statusMessage =
        "Your verification is being reviewed. You can keep using the app while it finishes.";
    } else if (status === "REVERIFICATION_REQUIRED") {
      statusTitle = "Re-verification required";
      statusMessage =
        "You changed your primary photo and need to verify again.";
    } else if (status === "REJECTED") {
      statusTitle = "Verification rejected";
      statusMessage =
        "Your verification was rejected. Please try again with a clearer selfie.";
    } else if (status === "PENDING") {
      statusTitle = "Verification pending";
      statusMessage = "Please complete verification to access discovery.";
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="max-w-md p-8 text-center">
          {locationPromptOpen && status === "VERIFIED" ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-marigold/30 bg-marigold/10 text-2xl text-marigold">
                <span aria-hidden="true">⌖</span>
              </div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
                Make discovery local
              </p>
              <h1 className="font-display text-2xl text-cream">
                Share your location?
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-cream-dim">
                Allow your current location so we can show you people nearby.
                Your exact location is kept private and is never shown on your profile.
              </p>
              {locationError && (
                <p className="mt-4 text-[14px] text-sindoor-light">{locationError}</p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  variant="primary"
                  onClick={requestAndSaveLocation}
                  disabled={locationRequesting}
                  showBloom
                  className="w-full"
                >
                  {locationRequesting ? "Getting your location…" : "Allow location"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={continueWithoutLocation}
                  disabled={locationRequesting}
                  className="w-full"
                >
                  Not now
                </Button>
              </div>
            </>
          ) : (
            <>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
            {status === "VERIFIED" ? "You're all set" : "Verification needed"}
          </p>
          <h1 className="font-display text-2xl text-cream">{statusTitle}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-cream-dim">
            {statusMessage}
          </p>
          {(status === "REVERIFICATION_REQUIRED" || status === "REJECTED") && (
            <button
              onClick={startVerificationAgain}
              className="mt-4 w-full btn-primary"
            >
              Verify again
            </button>
          )}
            </>
          )}
        </Card>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120d0b] text-cream">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,162,2,0.18),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(230,57,80,0.1),transparent_20%),linear-gradient(90deg,#120d0b_0%,#190f0d_38%,#150d0a_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="relative hidden w-[38%] border-r border-cream/8 bg-[#120d0b]/85 px-8 py-10 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0a202] text-[19px] text-[#1b0e14] shadow-[0_0_20px_rgba(240,162,2,0.7)]">
              ❤
            </div>
            <div className="font-display text-3xl font-medium italic text-cream">Kindred</div>
          </div>

          <div className="mt-8 pt-4">
            <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-[#e6b65d]">
              {step + 1} of {totalSteps}
            </div>

            <div className="max-w-[360px]">
              {step === 0 && (
                <>
                  <h1 className="font-display text-[4rem] leading-[0.9] tracking-[-0.06em] text-cream">First, the easy part.</h1>
                  <p className="mt-5 max-w-xs text-[1.05rem] leading-[1.6] text-cream/70">A name, a birthday, and how you identify — thirty seconds, tops.</p>
                </>
              )}
              {step === 1 && (
                <>
                  <h1 className="font-display text-[4rem] leading-[0.9] tracking-[-0.06em] text-cream">Now the interesting part.</h1>
                  <p className="mt-5 max-w-xs text-[1.05rem] leading-[1.6] text-cream/70">Your story and the things you love. This is what starts conversations.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="font-display text-[4rem] leading-[0.9] tracking-[-0.06em] text-cream">What are you open to?</h1>
                  <p className="mt-5 max-w-xs text-[1.05rem] leading-[1.6] text-cream/70">Tell people what kind of connection you’re really looking for.</p>
                </>
              )}
              {step === 3 && (
                <>
                  <h1 className="font-display text-[4rem] leading-[0.9] tracking-[-0.06em] text-cream">Let them see you.</h1>
                  <p className="mt-5 max-w-xs text-[1.05rem] leading-[1.6] text-cream/70">Real photos get real matches. Your first one leads the profile.</p>
                </>
              )}
              {step === 4 && (
                <>
                  <h1 className="font-display text-[4rem] leading-[0.9] tracking-[-0.06em] text-cream">Almost there — one selfie.</h1>
                  <p className="mt-5 max-w-xs text-[1.05rem] leading-[1.6] text-cream/70">A quick live photo keeps Kindred full of real people.</p>
                </>
              )}
            </div>

            <div className="mt-10 flex w-full max-w-[310px] flex-col gap-4">
              {[
                { label: 'The basics', done: step > 0, active: step === 0 },
                { label: 'About you', done: step > 1, active: step === 1 },
                { label: 'Photos', done: step > 3, active: step === 3 },
                { label: 'Verification', done: step > 4, active: step === 4 },
              ].map((item, index) => (
                <div key={item.label} className="relative flex items-center gap-4">
                  {index < 3 && (
                    <div className={`absolute left-[12px] top-[38px] h-6 w-px ${item.done ? 'bg-[#f0a202]' : 'bg-cream/10'}`} />
                  )}
                  <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[12px] ${item.done ? 'border-[#f0a202] bg-[#f0a202] text-[#1b0e14]' : item.active ? 'border-[#f0a202] bg-[#f0a202]/10 text-[#f0a202]' : 'border-cream/15 bg-transparent text-cream/50'}`}>
                    {item.done ? '✓' : index + 1}
                  </div>
                  <div className={`text-[1.05rem] ${item.active ? 'text-cream font-medium' : 'text-cream/65'}`}>
                    {item.label}
                    {item.active && <span className="ml-2 text-[#f0a202] text-xs">You’re here</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 text-cream/55 text-[0.92rem]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-cream/20 text-[10px]">i</div>
            Everything you share stays private until you match.
          </div>
        </aside>

        <section className="relative flex w-full flex-1 items-center justify-center px-5 py-10 md:px-10 lg:px-16">
          <div className="w-full max-w-[820px]">
            <div className="mb-10 flex justify-center">
              <StepProgress current={step} total={totalSteps} />
            </div>

            <div className="mx-auto w-full max-w-[760px] rounded-[28px] border border-cream/8 bg-[#1b120f]/60 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-8">
              {step === 0 && (
                <StepBasicInfo
                  form={form}
                  updateForm={updateForm}
                  onNext={submitBasicInfo}
                />
              )}
              {step === 1 && (
                <StepAbout
                  form={form}
                  updateForm={updateForm}
                  onNext={submitAboutAndCreateProfile}
                  onBack={() => setStep(0)}
                  saving={saving}
                  error={error}
                />
              )}
              {step === 2 && (
                <StepLookingFor
                  value={form.lookingFor}
                  onChange={(value) => updateForm({ lookingFor: value })}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <StepPhotos
                  photos={photos}
                  uploadingPhotos={uploadingPhotos}
                  onSelect={handlePhotoSelect}
                  onNext={() => setStep(4)}
                  error={error}
                />
              )}
              {step === 4 && (
                <StepVerification
                  selfieFile={selfieFile}
                  setSelfieFile={setSelfieFile}
                  onSubmit={submitVerification}
                  saving={saving}
                  error={error}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// STEP 1 — Basic info (local state only, no API call yet)
// ---------------------------------------------------------------------------
function StepBasicInfo({ form, updateForm, onNext }) {
  const canContinue = form.displayName && form.dateOfBirth && form.gender;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[3.2rem] leading-[0.96] tracking-[-0.06em] text-cream">The basics</h2>
        <p className="mx-auto mt-3 max-w-md text-[1.05rem] leading-[1.6] text-cream/70">
          Nothing anyone couldn’t already guess from meeting you — but it helps us find your people.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[620px] space-y-6 pt-2">
        <div>
          <Input
            label="What should we call you?"
            value={form.displayName}
            placeholder="Your first name"
            onChange={(e) => updateForm({ displayName: e.target.value })}
            className="!rounded-[18px] border-cream/10 bg-[#2a1f1d]/80"
          />
        </div>

        <div>
          <Input
            label="Birthday"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateForm({ dateOfBirth: e.target.value })}
            className="!rounded-[18px] border-cream/10 bg-[#2a1f1d]/80"
          />
          <p className="mt-2 text-[13px] text-cream/55">You must be 18 or older. Your age, not your birthday, shows on your profile.</p>
        </div>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim/80">I am a</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ChoicePills
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(v) => updateForm({ gender: v })}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-[13px] text-cream/50">Fill all three to continue.</div>
        <Button
          variant="primary"
          disabled={!canContinue}
          onClick={onNext}
          className="min-w-[180px]"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
// STEP 2 — About (bio, interests, profession) - submits PUT /profile,
// creating the actual Profile row for the first time.
// ---------------------------------------------------------------------------
function StepAbout({ form, updateForm, onNext, onBack, saving, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[3.2rem] leading-[0.95] tracking-[-0.06em] text-cream">A little more about you</h2>
        <p className="mx-auto mt-3 max-w-md text-[1.05rem] leading-[1.6] text-cream/70">This is what people see first — make it sound like you, not a résumé.</p>
      </div>

      <div className="mx-auto w-full max-w-[620px] space-y-7">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim/80">Bio</label>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream/45">0/240</span>
          </div>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => updateForm({ bio: e.target.value })}
            className="w-full rounded-[18px] border border-cream/10 bg-[#2a1f1d]/80 px-4 py-3.5 text-[15px] text-cream outline-none transition-all placeholder:text-cream-dim/45 focus:border-marigold/60 focus:shadow-[0_0_0_1px_rgba(240,162,2,0.3)]"
            placeholder="Tell people something real — what a perfect Sunday looks like, the thing you can’t stop talking about."
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim/80">Interests</p>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream/45">1 picked — great profiles show 5+</span>
          </div>
          <ChoicePills
            options={INTEREST_OPTIONS}
            value={form.interests}
            onChange={(v) => updateForm({ interests: v })}
            multiple
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim/80">Profession</p>
          </div>
          <ChoicePills
            options={PROFESSION_OPTIONS}
            value={form.profession}
            onChange={(v) => updateForm({ profession: v })}
          />
        </div>
      </div>

      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="px-0 text-[#f7d9a1] hover:text-cream">
          ← Back
        </Button>
        <Button
          variant="primary"
          disabled={saving}
          onClick={onNext}
          className="min-w-[180px]"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}

function StepLookingFor({ value, onChange, onNext, onBack }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[3.2rem] leading-[0.95] tracking-[-0.06em] text-cream">What are you open to?</h2>
        <p className="mx-auto mt-3 max-w-md text-[1.05rem] leading-[1.6] text-cream/70">Choose as many as feel right — the more honest, the better the matches.</p>
      </div>

      <div className="mx-auto w-full max-w-[620px]">
        <ChoicePills
          options={LOOKING_FOR_OPTIONS}
          value={value}
          onChange={onChange}
          multiple
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="px-0 text-[#f7d9a1] hover:text-cream">← Back</Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={value.length === 0}
          className="min-w-[180px]"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

//   / STEP 3 — Photos, via the presigned-upload flow
// ---------------------------------------------------------------------------
function StepPhotos({ photos, uploadingPhotos, onSelect, onNext, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[3.2rem] leading-[0.95] tracking-[-0.06em] text-cream">Add your photos</h2>
        <p className="mx-auto mt-3 max-w-md text-[1.05rem] leading-[1.6] text-cream/70">Big, clear, unmistakably you. Your first photo becomes your primary — the one everyone sees first.</p>
      </div>

      <div className="mx-auto w-full max-w-[620px]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-cream/15 bg-[#221915]/60 p-4">
            {photos[0] ? (
              <div className="relative w-full max-w-[260px] overflow-hidden rounded-[22px] border border-cream/10 bg-[#2a1f1d] shadow-[0_10px_35px_-20px_rgba(0,0,0,0.9)]">
                <img src={photos[0].previewUrl || photos[0].publicUrl} alt="Primary profile photo" className="aspect-[4/5] w-full object-cover" />
                <div className="absolute left-3 top-3 rounded-full bg-[#f0a202] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1b0e14]">Primary</div>
              </div>
            ) : (
              <div className="flex h-[220px] w-full max-w-[260px] items-center justify-center rounded-[22px] border border-dashed border-cream/15 bg-[#2a1f1d]/70 text-cream/40">No photo yet</div>
            )}
          </div>

          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-cream/15 bg-[#2a1f1d]/70 text-center transition-all hover:border-marigold/60 hover:bg-[#302420]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cream/15 text-[1.5rem] text-cream/80">＋</div>
            <div className="text-[1.05rem] text-cream">Add photos</div>
            <div className="mt-1 text-[13px] text-cream/55">JPG or PNG, up to 6 total</div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingPhotos}
              onChange={(e) => onSelect(e.target.files)}
            />
          </label>
        </div>

        <div className="mt-3 text-center text-[13px] text-cream/50">{photos.length}/6 added — at least one to continue</div>
      </div>

      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => {}} className="px-0 text-[#f7d9a1] opacity-0 pointer-events-none">← Back</Button>
        <Button
          variant="primary"
          disabled={photos.length === 0 || uploadingPhotos}
          onClick={onNext}
          className="min-w-[180px]"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

function StepVerification({
  selfieFile,
  setSelfieFile,
  onSubmit,
  saving,
  error,
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="font-display text-[3.2rem] leading-[0.95] tracking-[-0.06em] text-cream">Verify it’s really you</h2>
        <p className="mx-auto mt-3 max-w-lg text-[1.05rem] leading-[1.6] text-cream/70">A quick live photo compared against your profile pictures. It stays private and is never shown on your profile.</p>
      </div>

      <div className="w-full max-w-[520px]">
        <CameraCapture onCapture={setSelfieFile} />
      </div>

      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}

      <div className="w-full max-w-[420px]">
        <Button
          variant="primary"
          disabled={!selfieFile || saving}
          onClick={onSubmit}
          showBloom
          className="w-full"
        >
          {saving ? 'Submitting…' : 'Submit for verification'}
        </Button>
      </div>
    </div>
  );
}
