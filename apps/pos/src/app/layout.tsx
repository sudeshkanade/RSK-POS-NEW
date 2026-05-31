import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LicenseGuard } from "../components/common/LicenseGuard";
import { SyncProvider } from "../components/common/SyncProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RestroOS POS",
  description: "Production-grade restaurant management system by RSK Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} style={{ backgroundColor: '#000000' }} suppressHydrationWarning>
      {/* Prevent Flash of Unstyled Content (FOUC) for theme */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }

                // Clean up any registered Service Workers and Cache Storage with a session reload guard
                try {
                  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      if (registrations && registrations.length > 0) {
                        // Prevent infinite reload loops
                        var reloaded = sessionStorage.getItem('sw_cleaned_v2');
                        if (reloaded) return;
                        sessionStorage.setItem('sw_cleaned_v2', '1');

                        var promises = [];
                        for (var i = 0; i < registrations.length; i++) {
                          promises.push(registrations[i].unregister());
                        }
                        if (window.caches) {
                          promises.push(caches.keys().then(function(names) {
                            var cachePromises = [];
                            for (var j = 0; j < names.length; j++) {
                              cachePromises.push(caches.delete(names[j]));
                            }
                            return Promise.all(cachePromises);
                          }));
                        }
                        Promise.all(promises).then(function() {
                          setTimeout(function() {
                            window.location.reload();
                          }, 300);
                        });
                      }
                    });
                  }
                } catch (err) {}
              })()
            `,
          }}
        />
      </head>
      <body className={`overflow-hidden font-sans ${inter.variable}`} style={{ backgroundColor: '#000000', color: '#ffffff' }} suppressHydrationWarning>
        <LicenseGuard>
          <SyncProvider>
            {children}
          </SyncProvider>
        </LicenseGuard>
      </body>
    </html>
  );
}
