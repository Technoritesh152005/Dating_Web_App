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
    username:""
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
        username:form.username
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
      <main className="flex min-h-screen items-center justify-center px-6 bg-plum-night text-pearl">
        <Card className="max-w-md p-8 text-center bg-plum-surface border-plum-border shadow-2xl">
          {locationPromptOpen && status === "VERIFIED" ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold font-bold text-xl shadow-gold-glow">
                LOCATION
              </div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] font-bold text-gold">
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
                <Button
                  variant="primary"
                  onClick={requestAndSaveLocation}
                  disabled={locationRequesting}
                  showBloom
                  className="w-full"
                >
                  {locationRequesting ? "Saving Location..." : "Allow Location Access"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={continueWithoutLocation}
                  disabled={locationRequesting}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
                {status === "VERIFIED" ? "Profile Verified" : "Verification Status"}
              </span>
              <h1 className="font-display text-2xl font-bold text-pearl">{statusTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-pearl-dim">
                {statusMessage}
              </p>
              {(status === "REVERIFICATION_REQUIRED" || status === "REJECTED") && (
                <button
                  onClick={startVerificationAgain}
                  className="mt-6 w-full rounded-xl bg-saffron-gradient py-3.5 text-sm font-semibold text-pearl shadow-saffron-glow transition-all hover:scale-105"
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-plum-night text-pearl selection:bg-saffron selection:text-pearl">
      {/* Background Radial Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[36rem] w-[36rem] rounded-full bg-saffron/15 blur-[140px] animate-pulse-glow" />
        <div className="absolute -right-32 bottom-10 h-[36rem] w-[36rem] rounded-full bg-plum/40 blur-[150px] animate-float-slow" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1500px]">
        {/* Sidebar Stepper & Overview */}
        <aside className="relative hidden w-[38%] border-r border-plum-border/50 bg-plum-surface/70 px-8 py-10 lg:flex lg:flex-col backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-gradient text-pearl font-bold font-display text-lg shadow-saffron-glow">
              M
            </div>
            <div className="font-display text-2xl font-bold text-pearl">
              Melodis<span className="text-saffron">.</span>
            </div>
          </div>

          <div className="mt-6 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-gold font-bold">
                Step {step + 1} of {totalSteps}
              </span>
              <span className="font-mono text-xs text-pearl-muted font-bold">
                {Math.round(((step + 1) / totalSteps) * 100)}% Complete
              </span>
            </div>

            <div className="max-w-[360px] mt-4">
              {step === 0 && (
                <>
                  <h1 className="font-display text-4xl leading-tight font-bold text-pearl">Basic Profile Information</h1>
                  <p className="mt-3 text-sm leading-relaxed text-pearl-dim">Enter your display name, username, date of birth, and gender identity to begin.</p>
                </>
              )}
              {step === 1 && (
                <>
                  <h1 className="font-display text-4xl leading-tight font-bold text-pearl">Bio & Profession</h1>
                  <p className="mt-3 text-sm leading-relaxed text-pearl-dim">Share a short bio, select your primary interests, and specify your profession.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="font-display text-4xl leading-tight font-bold text-pearl">Connection Intent</h1>
                  <p className="mt-3 text-sm leading-relaxed text-pearl-dim">Select the types of relationships and connections you are looking to discover.</p>
                </>
              )}
              {step === 3 && (
                <>
                  <h1 className="font-display text-4xl leading-tight font-bold text-pearl">Profile Photography</h1>
                  <p className="mt-3 text-sm leading-relaxed text-pearl-dim">Upload up to 6 high-resolution photos. Your first photo will serve as your primary discovery avatar.</p>
                </>
              )}
              {step === 4 && (
                <>
                  <h1 className="font-display text-4xl leading-tight font-bold text-pearl">Identity Verification</h1>
                  <p className="mt-3 text-sm leading-relaxed text-pearl-dim">Capture a live selfie to execute AWS Rekognition facial comparison against your primary photo.</p>
                </>
              )}
            </div>

            {/* Stepper Milestones */}
            <div className="mt-10 flex w-full max-w-[320px] flex-col gap-4">
              {[
                { label: 'Basic Info', done: step > 0, active: step === 0 },
                { label: 'Bio & Interests', done: step > 1, active: step === 1 },
                { label: 'Connection Intent', done: step > 2, active: step === 2 },
                { label: 'Profile Photos', done: step > 3, active: step === 3 },
                { label: 'Identity Check', done: step > 4, active: step === 4 },
              ].map((item, index) => (
                <div key={item.label} className="relative flex items-center gap-4">
                  {index < 4 && (
                    <div className={`absolute left-[13px] top-[34px] h-6 w-0.5 ${item.done ? 'bg-gold' : 'bg-plum-border'}`} />
                  )}
                  <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold transition-all ${
                    item.done
                      ? 'bg-gold text-plum-night shadow-gold-glow'
                      : item.active
                      ? 'border border-saffron bg-saffron/20 text-saffron shadow-saffron-glow'
                      : 'border border-plum-border text-pearl-muted'
                  }`}>
                    {item.done ? 'DONE' : index + 1}
                  </div>
                  <div className={`text-sm font-medium ${item.active ? 'text-pearl' : 'text-pearl-dim'}`}>
                    {item.label}
                    {item.active && <span className="ml-2 font-mono text-xs text-gold font-bold">• Active</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 font-mono text-xs text-pearl-muted">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-pearl-muted text-[10px]">i</span>
            <span>Your personal data remains encrypted and safe.</span>
          </div>
        </aside>

        {/* Main Content Step Form Card */}
        <section className="relative flex w-full flex-1 items-center justify-center px-5 py-10 md:px-10 lg:px-16">
          <div className="w-full max-w-[820px]">
            <div className="mb-8 flex justify-center">
              <StepProgress current={step} total={totalSteps} />
            </div>

            <div className="mx-auto w-full max-w-[760px] rounded-[2.2rem] border border-plum-border/70 bg-plum-surface/85 p-6 shadow-2xl backdrop-blur-2xl md:p-10">
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
// STEP 1 — Basic info
// ---------------------------------------------------------------------------
function StepBasicInfo({ form, updateForm, onNext }) {
  const canContinue = form.displayName && form.dateOfBirth && form.gender;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl sm:text-4xl">Basic Information</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pearl-dim">
          Enter your display name, username, date of birth, and gender identity.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[620px] space-y-5 pt-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            placeholder="Your first name"
            onChange={(e) => updateForm({ displayName: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Username</label>
          <input
            type="text"
            value={form.username}
            placeholder="your_username"
            minLength={3}
            maxLength={20}
            autoComplete="username"
            onChange={(e) => updateForm({ username: e.target.value.toLowerCase() })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
          <p className="mt-1.5 font-mono text-[11px] text-pearl-muted">3-20 lowercase letters, numbers, or underscores.</p>
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateForm({ dateOfBirth: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
          <p className="mt-1.5 font-mono text-[11px] text-pearl-muted">Must be 18 or older. Only your age will be displayed.</p>
        </div>

        <div>
          <p className="mb-3 font-mono text-xs font-semibold text-pearl-dim">Gender Identity</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ChoicePills
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(v) => updateForm({ gender: v })}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <div className="font-mono text-xs text-pearl-muted">Complete all fields to proceed.</div>
        <button
          disabled={!canContinue}
          onClick={onNext}
          className="rounded-xl bg-saffron-gradient px-7 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-105 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// STEP 2 — About
function StepAbout({ form, updateForm, onNext, onBack, saving, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl sm:text-4xl">Bio & Profession</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pearl-dim">Share your bio, select your primary interests, and define your profession.</p>
      </div>

      <div className="mx-auto w-full max-w-[620px] space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <label className="font-semibold text-pearl-dim">Bio</label>
            <span className="text-pearl-muted">{form.bio.length}/240</span>
          </div>
          <textarea
            rows={4}
            maxLength={240}
            value={form.bio}
            onChange={(e) => updateForm({ bio: e.target.value })}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 placeholder-pearl-muted"
            placeholder="Share your interests, weekend activities, or what you enjoy discussing."
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between font-mono text-xs">
            <p className="font-semibold text-pearl-dim">Interests</p>
            <span className="text-gold font-bold">{form.interests.length} Selected</span>
          </div>
          <ChoicePills
            options={INTEREST_OPTIONS}
            value={form.interests}
            onChange={(v) => updateForm({ interests: v })}
            multiple
          />
        </div>

        <div>
          <p className="mb-3 font-mono text-xs font-semibold text-pearl-dim">Profession</p>
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
          className="rounded-xl bg-saffron-gradient px-7 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-105 disabled:opacity-50"
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
        <h2 className="font-display text-3xl font-bold text-pearl sm:text-4xl">Connection Intent</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pearl-dim">Select the relationship types and goals you are open to exploring.</p>
      </div>

      <div className="mx-auto w-full max-w-[620px]">
        <ChoicePills
          options={LOOKING_FOR_OPTIONS}
          value={value}
          onChange={onChange}
          multiple
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-plum-border/40">
        <button onClick={onBack} className="font-mono text-xs uppercase tracking-wider text-pearl-dim hover:text-pearl">Back</button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="rounded-xl bg-saffron-gradient px-7 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-105 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// STEP 4 — Photos with Upload Animation
function StepPhotos({ photos, uploadingPhotos, onSelect, onNext, error }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-pearl sm:text-4xl">Profile Photography</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pearl-dim">
          Upload up to 6 high-resolution photos. Your first photo will be set as your primary avatar.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[620px]">
        {/* Upload Cards Grid with Animations */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.key || index}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-plum-border bg-plum-night shadow-xl group"
            >
              <img
                src={photo.previewUrl || photo.publicUrl}
                alt={`Uploaded profile photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 rounded-full border border-gold/40 bg-plum-night/85 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gold backdrop-blur-md">
                  Primary Avatar
                </div>
              )}
              <div className="absolute top-2 right-2 rounded-full bg-mehendi px-2 py-0.5 font-mono text-[9px] font-bold text-plum-night">
                Uploaded
              </div>
            </div>
          ))}

          {/* Uploading Spinner Card */}
          {uploadingPhotos && (
            <div className="relative aspect-[4/5] flex flex-col items-center justify-center rounded-2xl border border-saffron/50 bg-saffron/10 p-4 shadow-saffron-glow animate-pulse">
              <div className="h-8 w-8 rounded-full border-2 border-saffron border-t-transparent animate-spin mb-2" />
              <span className="font-mono text-[10px] uppercase font-bold text-saffron">Uploading...</span>
            </div>
          )}

          {/* Add Photos Button Slot */}
          {photos.length < 6 && !uploadingPhotos && (
            <label className="relative aspect-[4/5] flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-plum-border/80 bg-plum-night/50 p-4 text-center transition-all hover:border-saffron hover:bg-plum-surface/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/10 border border-saffron/30 font-bold text-saffron text-lg mb-2">
                +
              </div>
              <span className="font-mono text-xs font-semibold text-pearl">Add Photo</span>
              <span className="mt-1 font-mono text-[10px] text-pearl-muted">JPG or PNG</span>
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

        <div className="mt-4 text-center font-mono text-xs text-pearl-dim font-semibold">
          {photos.length}/6 Uploaded — Add at least 1 photo to continue.
        </div>
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
          className="rounded-xl bg-saffron-gradient px-7 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-105 disabled:opacity-50"
        >
          Continue
        </button>
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
        <h2 className="font-display text-3xl font-bold text-pearl sm:text-4xl">Identity Verification</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-pearl-dim">
          Capture a quick live selfie. AWS Rekognition executes face comparison against your primary profile photo.
        </p>
      </div>

      <div className="w-full max-w-[520px]">
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
          className="w-full rounded-xl bg-saffron-gradient py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
        >
          {saving ? 'Submitting Verification...' : 'Submit Verification'}
        </button>
      </div>
    </div>
  );
}

