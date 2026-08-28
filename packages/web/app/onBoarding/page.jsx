"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { api } from "../../lib/api";
import { presignAndUpload } from "@/lib/uploadS3";
import { Card } from "@/components/user_interface/Card";
import { Button } from "@/components/user_interface/Button";
import { CameraCapture } from "@/components/cameraCapture";
import { ChoicePills } from "@/components/user_interface/ChoicePills";
import { StepProgress } from "@/components/user_interface/stepProgress";
import { CheckIcon } from "@/components/user_interface/Icons";

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
  { value: "LONG_TERM_RELATIONSHIP", label: "Long-term relationship" },
  { value: "SERIOUS_RELATIONSHIP", label: "Serious relationship" },
  { value: "CASUAL_DATING", label: "Casual dating" },
  { value: "FRIENDSHIP", label: "Friendship" },
  { value: "NEW_CONNECTIONS", label: "New connections" },
  { value: "OPEN_TO_ANYTHING", label: "Open to anything" },
  { value: "NOT_SURE_YET", label: "Not sure yet" },
  { value: "JUST_CHAT", label: "Just chatting" },
  { value: "TRAVEL_BUDDY", label: "Travel buddy" },
  { value: "GAMING_BUDDY", label: "Gaming buddy" },
  { value: "ACTIVITY_PARTNER", label: "Activity partner" },
  { value: "COFFEE_DATE", label: "Coffee & conversation" },
  { value: "FREE_TONIGHT", label: "Free tonight" },
];

const INTEREST_OPTIONS = [
  "Travel", "Music", "Cricket", "Football", "Basketball", "Tennis", "Badminton",
  "Cooking", "Baking", "Reading", "Fitness", "Running", "Yoga", "Cycling",
  "Movies", "TV Shows", "Anime", "Trekking", "Hiking", "Photography", "Art",
  "Dancing", "Gaming", "Board Games", "Technology", "Coding", "Startups",
  "Entrepreneurship", "Writing", "Poetry", "Fashion", "Shopping", "Food",
  "Coffee", "Tea", "Street Food", "Restaurants", "Pets", "Dogs", "Cats",
  "Nature", "Beach", "Mountains", "Camping", "Adventure", "Road Trips", "Cars",
  "Motorcycles", "Volunteering", "Meditation", "Self Improvement", "Podcasts",
  "Concerts", "Festivals", "Theatre", "Comedy", "Painting", "Crafts", "DIY",
  "Languages", "History", "Science", "Business", "Finance", "Investing",
  "Spirituality", "Socializing", "Nightlife", "Parties", "Karaoke",
].map((i) => ({ value: i, label: i }));

const totalSteps = 5;

const STEP_METADATA = [
  { label: "Basic Info", title: "Basic Profile Information", desc: "Enter your display name, username, date of birth, and gender identity to begin." },
  { label: "Bio & Interests", title: "Bio & Profession", desc: "Share a short bio, select your primary interests, and specify your profession." },
  { label: "Connection Intent", title: "Connection Intent", desc: "Select the types of relationships and connections you are looking to discover." },
  { label: "Profile Photos", title: "Profile Photography", desc: "Upload up to 6 photos. Click any photo to set it as your Primary Avatar." },
  { label: "Identity Check", title: "Identity Verification", desc: "Capture a live selfie to execute facial comparison against your primary photo." }
];

export default function OnboardingPage() {
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
    lookingFor: [],
    username: ""
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
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.verificationRequired) {
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
      setError("Please select your profession before continuing.");
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
        username: form.username
      });

      await api.put("/preferences", {
        lookingFor: form.lookingFor
      });
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to save profile information.");
    } finally {
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    if (!selfieFile) {
      setError("Please capture a selfie before submitting.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { key } = await presignAndUpload({
        file: selfieFile,
        presignPath: "/media/selfie/presign",
      });
      await api.post("/verification/selfie", { selfieKey: key });
      await refetch();
      setVerificationSubmitted(true);
      setComplete(true);
    } catch (err) {
      setError(err.message || "Failed to submit verification selfie");
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
            : "We could not get your current location. Please try again."
        );
        setLocationRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
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
    const status = user?.profile?.verificationStatus || user?.verificationStatus;
    if (!verificationSubmitted && status !== "UNDER_REVIEW") return undefined;

    const checkVerification = async () => {
      const refreshedUser = await refetch();
      const refreshedProfile = refreshedUser?.profile;
      const refreshedStatus = refreshedProfile?.verificationStatus || refreshedUser?.verificationStatus;

      if (refreshedStatus === "VERIFIED") {
        const hasLocation = refreshedProfile?.latitude != null && refreshedProfile?.longitude != null;
        if (hasLocation) {
          router.push("/discover");
        } else {
          setLocationPromptOpen(true);
        }
      }
    };

    const intervalId = window.setInterval(() => {
      checkVerification().catch(() => {});
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [refetch, user, verificationSubmitted, router]);

  const handlePhotoSelect = async (fileList) => {
    setError(null);
    setUploadingPhotos(true);
    const files = Array.from(fileList).slice(0, 6 - photos.length);
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
              photo.previewUrl === previewUrl ? { ...photo, key, publicUrl } : photo
            )
          );
        } catch (err) {
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current.delete(previewUrl);
          setPhotos((p) => p.filter((photo) => photo.previewUrl !== previewUrl));
          setError(err.message);
        }
      }
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const handleSetPrimaryPhoto = (indexToMakePrimary) => {
    if (indexToMakePrimary === 0) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [selected] = newPhotos.splice(indexToMakePrimary, 1);
      return [selected, ...newPhotos];
    });
  };

  if (loading || checkingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-plum-night">
        <p className="font-mono text-sm uppercase tracking-widest text-pearl-dim">
          Loading...
        </p>
      </main>
    );
  }

  if (complete) {
    const status = user?.profile?.verificationStatus || user?.verificationStatus;
    let statusMessage = "Discovery feed comes next.";
    let statusTitle = "Profile created";

    if (status === "UNDER_REVIEW") {
      statusTitle = "Verification under review";
      statusMessage = "Your verification is being reviewed. You can keep using the app while it finishes.";
    } else if (status === "REVERIFICATION_REQUIRED") {
      statusTitle = "Re-verification required";
      statusMessage = "You changed your primary photo and need to verify again.";
    } else if (status === "REJECTED") {
      statusTitle = "Verification rejected";
      statusMessage = "Your verification was rejected. Please try again with a clearer selfie.";
    } else if (status === "PENDING") {
      statusTitle = "Verification pending";
      statusMessage = "Please complete verification to access discovery.";
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-6 bg-plum-night text-pearl">
        <Card className="max-w-md p-8 text-center bg-plum-surface border-plum-border shadow-2xl">
          {locationPromptOpen && status === "VERIFIED" ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold font-bold text-sm tracking-wider">
                LOCATION
              </div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] font-bold text-gold">
                Enable Nearby Discovery
              </p>
              <h1 className="font-display text-2xl font-bold text-pearl">
                Share your location?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-pearl-dim">
                Allow location access so we can show compatible matches near you.
                Your exact coordinates remain private and are never displayed publicly.
              </p>
              {locationError && (
                <p className="mt-4 text-xs text-saffron font-medium">{locationError}</p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <Button variant="primary" onClick={requestAndSaveLocation} disabled={locationRequesting} showBloom className="w-full">
                  {locationRequesting ? "Saving Location..." : "Allow Location Access"}
                </Button>
                <Button variant="secondary" onClick={continueWithoutLocation} disabled={locationRequesting} className="w-full">
                  Skip for Now
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="inline-block mb-3 font-mono text-xs uppercase tracking-[0.2em] font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
                {status === "VERIFIED" ? "Profile Verified" : "Verification Status"}
              </span>
              <h1 className="font-display text-2xl font-bold text-pearl">{statusTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-pearl-dim">{statusMessage}</p>
              {(status === "REVERIFICATION_REQUIRED" || status === "REJECTED") && (
                <button
                  onClick={startVerificationAgain}
                  className="mt-6 w-full rounded-xl bg-saffron-gradient py-3.5 text-sm font-semibold text-pearl shadow-saffron-glow transition-all hover:scale-[1.02]"
                >
                  Start Verification Again
                </button>
              )}
            </>
          )}
        </Card>
      </main>
    );
  }

  const currentMeta = STEP_METADATA[step];

  return (
    <main className="relative min-h-screen bg-plum-night text-pearl selection:bg-saffron selection:text-pearl flex items-center justify-center p-6 lg:p-10">
      {/* Ambient Radial Background Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[36rem] w-[36rem] rounded-full bg-saffron/15 blur-[140px] animate-pulse-glow" />
        <div className="absolute -right-32 bottom-10 h-[36rem] w-[36rem] rounded-full bg-plum/40 blur-[150px] animate-float-slow" />
      </div>

      <div className="w-full max-w-[1380px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[680px]">
        {/* LEFT CARD - Equal Height Sidebar */}
        <aside className="lg:col-span-5 flex flex-col justify-between rounded-[2.2rem] border border-plum-border/70 bg-plum-surface/85 p-8 lg:p-10 shadow-2xl backdrop-blur-2xl transition-all duration-300">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-gradient text-pearl font-bold font-display text-xl shadow-saffron-glow">
                M
              </div>
              <div className="font-display text-2xl font-bold text-pearl">
                Melodis<span className="text-saffron">.</span>
              </div>
            </div>

            {/* Step Counter & Description */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-gold font-bold">
                  Step {step + 1} of {totalSteps}
                </span>
                <span className="font-mono text-xs font-bold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
                  {Math.round(((step + 1) / totalSteps) * 100)}% Complete
                </span>
              </div>

              <div className="mt-4">
                <h1 className="font-display text-3xl font-bold leading-tight text-pearl">
                  {currentMeta.title}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-pearl-dim">
                  {currentMeta.desc}
                </p>
              </div>
            </div>

            {/* Snake Path Stepper Milestone Connector */}
            <div className="relative mt-10">
              {/* Snake Connector Curve SVG with dynamic active tracer */}
              <svg className="pointer-events-none absolute left-4 top-5 h-[240px] w-24" fill="none" stroke="currentColor">
                {/* Background dashed snake curve path */}
                <path
                  d="M 12 10 Q 70 50 12 100 Q -30 150 12 200"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                {/* Active tracer path */}
                <path
                  d="M 12 10 Q 70 50 12 100 Q -30 150 12 200"
                  stroke="url(#snakeGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="300"
                  strokeDashoffset={300 - (step / 4) * 300}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0a202" />
                    <stop offset="100%" stopColor="#e63950" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex flex-col gap-6 relative z-10">
                {STEP_METADATA.map((item, index) => {
                  const done = step > index;
                  const active = step === index;
                  return (
                    <div key={item.label} className="flex items-center gap-4 transition-all duration-300">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold transition-all duration-300 ${
                        done
                          ? 'bg-gold text-plum-night shadow-gold-glow scale-105'
                          : active
                          ? 'border-2 border-saffron bg-saffron/20 text-saffron shadow-saffron-glow scale-110'
                          : 'border border-plum-border bg-plum-night/80 text-pearl-muted'
                      }`}>
                        {done ? <CheckIcon className="h-4 w-4" stroke="currentColor" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold transition-colors ${active ? 'text-pearl font-bold' : done ? 'text-pearl-dim' : 'text-pearl-muted'}`}>
                          {item.label}
                          {active && <span className="ml-2 inline-block font-mono text-xs text-gold font-bold">• Active</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Security Notice */}
          <div className="mt-8 pt-4 border-t border-plum-border/50 flex items-center gap-2 font-mono text-xs text-pearl-muted">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-pearl-muted text-[10px]">i</span>
            <span>Your personal data remains encrypted and safe.</span>
          </div>
        </aside>

        {/* RIGHT CARD - Equal Height Form Container */}
        <section className="lg:col-span-7 flex flex-col justify-between rounded-[2.2rem] border border-plum-border/70 bg-plum-surface/85 p-8 lg:p-10 shadow-2xl backdrop-blur-2xl transition-all duration-300">
          <div className="w-full mb-6">
            <StepProgress current={step} total={totalSteps} />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {step === 0 && (
              <StepBasicInfo form={form} updateForm={updateForm} onNext={submitBasicInfo} />
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
                onRemove={handleRemovePhoto}
                onMakePrimary={handleSetPrimaryPhoto}
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
        </section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// STEP COMPONENTS WITH ENHANCED HIGH-LEGIBILITY TYPOGRAPHY
// ---------------------------------------------------------------------------

function StepBasicInfo({ form, updateForm, onNext }) {
  const canContinue = form.displayName && form.dateOfBirth && form.gender;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl">Basic Information</h2>
        <p className="mt-2 text-sm text-pearl-dim">Enter your display name, username, date of birth, and gender identity.</p>
      </div>

      <div className="space-y-5 pt-2">
        <div>
          <label className="mb-2 block font-mono text-sm font-semibold text-pearl">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            placeholder="Your first name"
            onChange={(e) => updateForm({ displayName: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3.5 text-base text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-sm font-semibold text-pearl">Username</label>
          <input
            type="text"
            value={form.username}
            placeholder="your_username"
            minLength={3}
            maxLength={20}
            autoComplete="username"
            onChange={(e) => updateForm({ username: e.target.value.toLowerCase() })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3.5 text-base text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
          <p className="mt-2 font-mono text-xs text-pearl-dim">3-20 lowercase letters, numbers, or underscores.</p>
        </div>

        <div>
          <label className="mb-2 block font-mono text-sm font-semibold text-pearl">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateForm({ dateOfBirth: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3.5 text-base text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 [color-scheme:dark]"
          />
          <p className="mt-2 font-mono text-xs text-pearl-dim">Must be 18 or older. Only your age will be displayed.</p>
        </div>

        <div>
          <p className="mb-3 font-mono text-sm font-semibold text-pearl">Gender Identity</p>
          <ChoicePills
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={(v) => updateForm({ gender: v })}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <span className="font-mono text-xs text-pearl-dim">Complete all required fields to proceed.</span>
        <button
          disabled={!canContinue}
          onClick={onNext}
          className="rounded-xl bg-saffron-gradient px-8 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StepAbout({ form, updateForm, onNext, onBack, saving, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl">Bio & Profession</h2>
        <p className="mt-2 text-sm text-pearl-dim">Share a short bio, select your primary interests, and define your profession.</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-sm">
            <label className="font-semibold text-pearl">Bio</label>
            <span className="text-pearl-dim">{form.bio.length}/240</span>
          </div>
          <textarea
            rows={3}
            maxLength={240}
            value={form.bio}
            onChange={(e) => updateForm({ bio: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-base text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 placeholder-pearl-muted"
            placeholder="Share your interests, weekend activities, or what you enjoy discussing."
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between font-mono text-sm">
            <p className="font-semibold text-pearl">Interests</p>
            <span className="text-gold font-bold">{form.interests.length} Selected</span>
          </div>
          <div className="max-h-48 overflow-y-auto pr-1">
            <ChoicePills
              options={INTEREST_OPTIONS}
              value={form.interests}
              onChange={(v) => updateForm({ interests: v })}
              multiple
            />
          </div>
        </div>

        <div>
          <p className="mb-3 font-mono text-sm font-semibold text-pearl">Profession</p>
          <ChoicePills
            options={PROFESSION_OPTIONS}
            value={form.profession}
            onChange={(v) => updateForm({ profession: v })}
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-xs text-saffron font-medium">
          Alert: {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <button onClick={onBack} className="font-mono text-xs uppercase tracking-wider text-pearl-dim hover:text-pearl">
          Back
        </button>
        <button
          disabled={saving}
          onClick={onNext}
          className="rounded-xl bg-saffron-gradient px-8 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}

function StepLookingFor({ value, onChange, onNext, onBack }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl">Connection Intent</h2>
        <p className="mt-2 text-sm text-pearl-dim">Select the relationship types and goals you are open to exploring.</p>
      </div>

      <div className="max-h-72 overflow-y-auto pr-1">
        <ChoicePills
          options={LOOKING_FOR_OPTIONS}
          value={value}
          onChange={onChange}
          multiple
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <button onClick={onBack} className="font-mono text-xs uppercase tracking-wider text-pearl-dim hover:text-pearl">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="rounded-xl bg-saffron-gradient px-8 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StepPhotos({ photos, uploadingPhotos, onSelect, onRemove, onMakePrimary, onNext, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl">Profile Photography</h2>
        <p className="mt-2 text-sm text-pearl-dim">
          Upload up to 6 photos. The first photo is your primary avatar. Click any photo to set it as Primary.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={photo.key || index}
            className={`relative aspect-[4/5] overflow-hidden rounded-2xl border bg-plum-night shadow-xl group transition-all ${
              index === 0 ? 'border-gold shadow-gold-glow ring-2 ring-gold/40' : 'border-plum-border hover:border-saffron/60'
            }`}
          >
            <img
              src={photo.previewUrl || photo.publicUrl}
              alt={`Uploaded profile photo ${index + 1}`}
              className="h-full w-full object-cover"
            />

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-plum-night/90 text-pearl border border-plum-border shadow-md transition-transform hover:scale-110 hover:bg-saffron hover:text-pearl z-20"
              title="Remove photo"
            >
              ✕
            </button>

            <div className="absolute top-2 left-2 z-20">
              {index === 0 ? (
                <span className="rounded-full border border-gold/50 bg-plum-night/90 px-2.5 py-0.5 font-mono text-xs font-bold text-gold backdrop-blur-md shadow-gold-glow">
                  Primary
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onMakePrimary(index)}
                  className="rounded-full border border-plum-border bg-plum-night/80 px-2.5 py-0.5 font-mono text-xs font-semibold text-pearl-dim hover:text-pearl hover:border-gold backdrop-blur-md transition-colors"
                >
                  Set Primary
                </button>
              )}
            </div>
          </div>
        ))}

        {uploadingPhotos && (
          <div className="relative aspect-[4/5] flex flex-col items-center justify-center rounded-2xl border border-saffron/50 bg-saffron/10 p-4 shadow-saffron-glow animate-pulse">
            <div className="h-8 w-8 rounded-full border-2 border-saffron border-t-transparent animate-spin mb-2" />
            <span className="font-mono text-xs uppercase font-bold text-saffron">Uploading...</span>
          </div>
        )}

        {photos.length < 6 && !uploadingPhotos && (
          <label className="relative aspect-[4/5] flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-plum-border/80 bg-plum-night/50 p-4 text-center transition-all hover:border-saffron hover:bg-plum-surface/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/10 border border-saffron/30 font-bold text-saffron text-lg mb-2">
              +
            </div>
            <span className="font-mono text-xs font-semibold text-pearl">Add Photo</span>
            <span className="mt-1 font-mono text-xs text-pearl-dim">JPG or PNG</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingPhotos}
              onChange={(e) => onSelect(e.target.files)}
            />
          </label>
        )}
      </div>

      <div className="text-center font-mono text-xs text-pearl-dim font-semibold">
        {photos.length}/6 Uploaded — Add at least 1 photo to continue.
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-xs text-saffron font-medium">
          Alert: {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <div className="w-16" />
        <button
          disabled={photos.length === 0 || uploadingPhotos}
          onClick={onNext}
          className="rounded-xl bg-saffron-gradient px-8 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StepVerification({ selfieFile, setSelfieFile, onSubmit, saving, error }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="font-display text-3xl font-bold text-pearl">Identity Verification</h2>
        <p className="mt-2 text-sm text-pearl-dim max-w-lg mx-auto">
          Capture a quick live selfie. AWS Rekognition executes face comparison against your primary profile photo.
        </p>
      </div>

      <div className="w-full max-w-[480px]">
        <CameraCapture onCapture={setSelfieFile} />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-xs text-saffron font-medium">
          Alert: {error}
        </div>
      )}

      <div className="w-full max-w-[360px]">
        <button
          disabled={!selfieFile || saving}
          onClick={onSubmit}
          className="w-full rounded-xl bg-saffron-gradient py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
        >
          {saving ? 'Submitting Verification...' : 'Submit Verification'}
        </button>
      </div>
    </div>
  );
}
