export default function FivePartTraining() {
  const loomVideoId = "46b9376ca7e0471a910a955e47a4a6ec";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <div className="max-w-5xl mx-auto p-8 md:p-12 lg:p-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            5 Part Process to Landing a PM Offer
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Learn the proven framework that helps PMs land their dream offers
          </p>
        </div>

        {/* Video Embed Section */}
        <div className="mb-12">
          <div className="rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 p-6 md:p-8">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.loom.com/embed/${loomVideoId}`}
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-[1.5rem]"
                style={{ minHeight: "315px" }}
                title="5 Part Process to Landing a PM Offer"
              />
            </div>
          </div>
        </div>

        {/* Sign Up Button Section */}
        <div className="text-center">
          <a
            href="/auth/sign-up"
            className="inline-block w-full max-w-md px-10 py-6 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200"
            aria-label="Sign up to get started"
          >
            Sign Up to Get Started →
          </a>
          <p className="mt-4 text-center text-sm text-gray-600 font-medium">
            Join thousands of PMs who've already leveled up their careers
          </p>
        </div>
      </div>
    </div>
  );
}

