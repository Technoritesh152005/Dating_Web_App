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

const totalSteps = 4;

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
        profession: form.profession,
      });
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
              onClick={() => router.push("/onBoarding")}
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-bloom-soft blur-3xl animate-float-slow" />
      </div>

      <div className="w-full max-w-lg">
        <StepProgress current={step} total={totalSteps} />

        <Card className="p-8">
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
            <StepPhotos
              photos={photos}
              uploadingPhotos={uploadingPhotos}
              onSelect={handlePhotoSelect}
              onNext={() => setStep(3)}
              error={error}
            />
          )}
          {step === 3 && (
            <StepVerification
              selfieFile={selfieFile}
              setSelfieFile={setSelfieFile}
              onSubmit={submitVerification}
              saving={saving}
              error={error}
            />
          )}
        </Card>
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
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl text-cream">The basics</h2>
        <p className="mt-1 text-[14px] text-cream-dim">
          Nothing anyone can't already guess from meeting you.
        </p>
      </div>
      <Input
        label="Name"
        value={form.displayName}
        onChange={(e) => updateForm({ displayName: e.target.value })}
      />
      <Input
        label="Date of birth"
        type="date"
        value={form.dateOfBirth}
        onChange={(e) => updateForm({ dateOfBirth: e.target.value })}
      />
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
          Gender
        </p>
        <ChoicePills
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={(v) => updateForm({ gender: v })}
        />
      </div>
      <Button
        variant="primary"
        disabled={!canContinue}
        onClick={onNext}
        className="mt-2 w-full"
      >
        Continue
      </Button>
    </div>
  );
}
// STEP 2 — About (bio, interests, profession) - submits PUT /profile,
// creating the actual Profile row for the first time.
// ---------------------------------------------------------------------------
function StepAbout({ form, updateForm, onNext, onBack, saving, error }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl text-cream">
          A little more about you
        </h2>
        <p className="mt-1 text-[14px] text-cream-dim">
          This is what people see first — make it sound like you.
        </p>
      </div>
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
          Bio
        </label>
        <textarea
          rows={3}
          value={form.bio}
          onChange={(e) => updateForm({ bio: e.target.value })}
          className="w-full rounded-2xl border border-cream/10 bg-dusk-light px-5 py-3.5 text-[15px] text-cream outline-none focus:border-marigold/60"
          placeholder="Tell people something real."
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
          Interests
        </p>
        <ChoicePills
          options={INTEREST_OPTIONS}
          value={form.interests}
          onChange={(v) => updateForm({ interests: v })}
          multiple
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
          Profession
        </p>
        <ChoicePills
          options={PROFESSION_OPTIONS}
          value={form.profession}
          onChange={(v) => updateForm({ profession: v })}
        />
      </div>
      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          variant="primary"
          disabled={saving}
          onClick={onNext}
          className="flex-1"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

//   / STEP 3 — Photos, via the presigned-upload flow
// ---------------------------------------------------------------------------
function StepPhotos({ photos, uploadingPhotos, onSelect, onNext, error }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl text-cream">Add your photos</h2>
        <p className="mt-1 text-[14px] text-cream-dim">
          At least one — your first photo becomes your primary.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.key}
            src={p.previewUrl || p.publicUrl}
            alt=""
            className="aspect-square rounded-2xl object-cover"
          />
        ))}
        {photos.length < 6 && (
          <label className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cream/20 text-cream-dim hover:border-marigold/50 hover:text-marigold">
            <span className="text-2xl">+</span>
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
      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}
      <Button
        variant="primary"
        disabled={photos.length === 0 || uploadingPhotos}
        onClick={onNext}
        className="mt-2 w-full"
      >
        Continue
      </Button>
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
    <div className="flex flex-col items-center gap-5 text-center">
      <div>
        <h2 className="font-display text-2xl text-cream">
          Verify it's really you
        </h2>
        <p className="mt-1 text-[14px] text-cream-dim">
          A quick live photo — this stays private and is never shown on your
          profile.
        </p>
      </div>
      <CameraCapture onCapture={setSelfieFile} />
      {error && <p className="text-[14px] text-sindoor-light">{error}</p>}
      <Button
        variant="primary"
        disabled={!selfieFile || saving}
        onClick={onSubmit}
        showBloom
        className="w-full"
      >
        {saving ? "Submitting…" : "Submit for verification"}
      </Button>
    </div>
  );
}
