import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Factory,
  Globe2,
  Handshake,
  Landmark,
  MessageCircle,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { useEffect } from "react";
import { b2bConnectFallbackProfile } from "../config/deployment";
import { usePublicBusinessProfiles } from "../modules/business-profile";
import { useNetworkBlueprint } from "../modules/network-blueprint";
import { useB2bConnectAppInfo } from "../modules/overview";
import "./b2bconnect-public.css";

const fallbackCapabilities = [
  {
    key: "directory",
    name: "Directory",
    description: "Find capable production partners",
    stage: "active"
  },
  { key: "rfq", name: "RFQ", description: "Discover products and suppliers", stage: "next" },
  {
    key: "networking",
    name: "Networking",
    description: "Build your business network",
    stage: "next"
  },
  {
    key: "export-intelligence",
    name: "Export Intelligence",
    description: "Create opportunities across markets",
    stage: "next"
  }
] as const;
const capabilityIcons = [
  Building2,
  PackageSearch,
  Handshake,
  Factory,
  UsersRound,
  BriefcaseBusiness,
  CalendarDays,
  Landmark,
  TrendingUp
] as const;

export function B2bConnectLandingPage() {
  const { appInfo } = useB2bConnectAppInfo();
  const { blueprint } = useNetworkBlueprint();
  const publicProfiles = usePublicBusinessProfiles();
  const profile = appInfo ?? b2bConnectFallbackProfile;
  const capabilities = blueprint?.capabilities ?? fallbackCapabilities;
  const initials = profile.brandName
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    document.title = `${profile.brandName} | Digital Business Network`;
  }, [profile.brandName]);

  return (
    <div className="b2b-public">
      <header className="b2b-nav">
        <a className="b2b-brand" href="/" aria-label={`${profile.brandName} home`}>
          <span className="b2b-brand-mark">{initials}</span>
          <span>{profile.brandName}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#discover">Operating system</a>
          <a href="#associations">Associations</a>
          <a href="#businesses">Businesses</a>
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Trust</a>
        </nav>
        <a className="b2b-nav-action" href="/app">
          Open business desk <ArrowRight size={16} />
        </a>
      </header>

      <main>
        <section className="b2b-hero">
          <div className="b2b-orbit b2b-orbit-one" />
          <div className="b2b-orbit b2b-orbit-two" />
          <div className="b2b-hero-copy">
            <div className="b2b-eyebrow">
              <Sparkles size={15} />
              {blueprint?.positioning.primary ?? "The Digital Business Network"}
            </div>
            <h1>
              The textile industry.
              <span> Connected as one operating system.</span>
            </h1>
            <p>
              {blueprint?.positioning.secondary ?? profile.purpose}. Discover, collaborate, trade,
              and grow through one trusted industry network.
            </p>
            <div className="b2b-hero-actions">
              <a className="b2b-button b2b-button-primary" href="/app">
                Enter marketplace <ArrowRight size={18} />
              </a>
              <a className="b2b-button b2b-button-secondary" href="#discover">
                <Search size={18} /> Explore the network
              </a>
            </div>
            <div className="b2b-trust-line">
              <span>
                <BadgeCheck size={17} /> Verified profiles
              </span>
              <span>
                <ShieldCheck size={17} /> Trusted enquiries
              </span>
              <span>
                <Handshake size={17} /> Direct connections
              </span>
            </div>
          </div>

          <div className="b2b-network-card" aria-label="Buyer and seller network illustration">
            <div className="b2b-network-label">LIVE BUSINESS NETWORK</div>
            <div className="b2b-network-stage">
              <span className="b2b-network-line line-one" />
              <span className="b2b-network-line line-two" />
              <span className="b2b-network-line line-three" />
              <div className="b2b-node b2b-node-buyer">
                <UsersRound size={22} />
                <strong>Buyer</strong>
                <small>Posts a requirement</small>
              </div>
              <div className="b2b-node b2b-node-match">
                <Handshake size={25} />
                <strong>Match</strong>
              </div>
              <div className="b2b-node b2b-node-seller">
                <Factory size={22} />
                <strong>Seller</strong>
                <small>Responds with capability</small>
              </div>
            </div>
            <div className="b2b-signal">
              <span className="b2b-signal-dot" />A simpler path from requirement to relationship
            </div>
          </div>
        </section>

        <section className="b2b-industries" id="discover">
          <div className="b2b-section-heading">
            <span>Tirupur Industry Operating System</span>
            <h2>{blueprint?.positioning.secondary ?? "Opportunity across every industry"}</h2>
            <p>
              Directory, leads, RFQ, capacity, networking, jobs, events, finance, and export
              intelligence in one connected platform.
            </p>
          </div>
          <div className="b2b-industry-grid">
            {capabilities.map(({ name, description, stage }, index) => {
              const Icon = capabilityIcons[index] ?? Globe2;
              return (
                <article key={name} className="b2b-industry-card">
                  <div className="b2b-industry-number">
                    {stage === "active" ? "LIVE" : `0${index + 1}`}
                  </div>
                  <Icon size={27} />
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <a href="/app" aria-label={`Explore ${name}`}>
                    <ArrowRight size={18} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="b2b-association-section" id="associations">
          <div className="b2b-section-heading">
            <span>Association integration</span>
            <h2>Digital hubs for the organisations that already unite Tirupur.</h2>
            <p>
              Association participation becomes a trusted path to discovery, member services, and
              opportunity.
            </p>
          </div>
          <div className="b2b-association-grid">
            {blueprint?.associations.map((association) => (
              <article key={association.code}>
                <strong>{association.code}</strong>
                <h3>{association.name}</h3>
                <p>{association.description}</p>
                <a href="/app">
                  Open member portal <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="b2b-whatsapp-section">
          <div>
            <span>WHATSAPP FIRST</span>
            <h2>Business moves where Tirupur already works.</h2>
            <p>
              Every marketplace workflow is designed to reach members through WhatsApp—not wait for
              an email inbox.
            </p>
          </div>
          <div className="b2b-whatsapp-grid">
            {blueprint?.whatsapp.map((item) => (
              <article key={item.name}>
                <MessageCircle size={22} />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="b2b-public-profiles" id="businesses">
          <div className="b2b-section-heading">
            <span>Verified network</span>
            <h2>Discover approved Tirupur businesses.</h2>
            <p>
              Profiles are client-owned, administrator-reviewed, and published only after approval.
            </p>
          </div>
          <div className="b2b-profile-grid">
            {publicProfiles.items.length > 0 ? (
              publicProfiles.items.map((business) => (
                <article key={business.uuid}>
                  <div className="b2b-profile-top">
                    <span>{business.businessName.slice(0, 2).toUpperCase()}</span>
                    <small>{business.association}</small>
                  </div>
                  <h3>{business.businessName}</h3>
                  <b>{business.industrySegment}</b>
                  <p>{business.description}</p>
                  <div className="b2b-profile-tags">
                    {business.capabilities.slice(0, 3).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  {business.whatsappEnabled && business.whatsappNumber ? (
                    <a href={`https://wa.me/${business.whatsappNumber.replace(/\D/gu, "")}`}>
                      <MessageCircle size={17} /> WhatsApp inquiry
                    </a>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="b2b-profile-empty">
                <BadgeCheck size={25} />
                <h3>Approved profiles will appear here</h3>
                <p>
                  Sign in to create your business profile and submit it for administrator review.
                </p>
                <a href="/login">
                  Create business profile <ArrowRight size={16} />
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="b2b-process" id="how-it-works">
          <div className="b2b-process-intro">
            <span>HOW IT WORKS</span>
            <h2>From discovery to deal, without the noise.</h2>
            <p>A focused workspace keeps both sides of the market moving with clarity.</p>
          </div>
          <div className="b2b-steps">
            <article>
              <b>1</b>
              <div>
                <h3>Build your profile</h3>
                <p>Present your products, services, and business capabilities.</p>
              </div>
            </article>
            <article>
              <b>2</b>
              <div>
                <h3>Discover a fit</h3>
                <p>Find relevant buyers, sellers, and active opportunities.</p>
              </div>
            </article>
            <article>
              <b>3</b>
              <div>
                <h3>Start the conversation</h3>
                <p>Connect directly and turn a requirement into a relationship.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="b2b-cta" id="trust">
          <div>
            <span>YOUR NEXT BUSINESS CONNECTION</span>
            <h2>Good business starts with the right introduction.</h2>
          </div>
          <a className="b2b-button b2b-button-light" href="/app">
            Open your business desk <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer className="b2b-footer">
        <div className="b2b-brand">
          <span className="b2b-brand-mark">{initials}</span>
          <span>{profile.brandName}</span>
        </div>
        <p>{profile.tagline}</p>
        <a href="/app">
          Business desk <ArrowRight size={15} />
        </a>
      </footer>
    </div>
  );
}
