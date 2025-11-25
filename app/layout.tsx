import type { Metadata } from "next";
import { 
  Plus_Jakarta_Sans, 
  Inter, 
  Lato, 
  Roboto, 
  Open_Sans, 
  Source_Sans_3,
  PT_Serif,
  Crimson_Text
} from "next/font/google";
import "./globals.css";
import { ConditionalLayout } from "./components/ConditionalLayout";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { LaunchDarklyProvider } from "./components/LaunchDarklyProvider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { initializeAmplitude } from "@/lib/amplitude/server";
import { AmplitudeProvider } from "./components/AmplitudeProvider";

// Initialize Amplitude on server startup
initializeAmplitude();

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

// Resume fonts - optimized for professional documents
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-sans",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-crimson-text",
});

export const metadata: Metadata = {
  title: "Product Careerlyst | Level Up Your PM Career",
  description: "Product Careerlyst is dedicated to leveling you up as a product manager. Get a new job, get promoted, or become more effective in your role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${inter.variable} ${lato.variable} ${roboto.variable} ${openSans.variable} ${sourceSans.variable} ${ptSerif.variable} ${crimsonText.variable} antialiased`}>
        <Toaster position="top-right" richColors />
        <LaunchDarklyProvider>
          <AmplitudeProvider>
            <ConditionalLayout
              navigation={<Navigation />}
              footer={<Footer />}
            >
              {children}
            </ConditionalLayout>
          </AmplitudeProvider>
        </LaunchDarklyProvider>
        <Analytics />
      </body>
    </html>
  );
}
