import {
  ArrowRight,
  BadgePercent,
  Heart,
  Home,
  Laptop,
  PackageCheck,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck
} from "lucide-react";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { ecommerceFallbackProfile } from "../config/deployment";
import { useEcommerceAppInfo } from "../modules/overview";
import "./ecommerce-public.css";

const categories = [
  { icon: Shirt, name: "Style & lifestyle", color: "coral" },
  { icon: Home, name: "Home & living", color: "lemon" },
  { icon: Laptop, name: "Tech & accessories", color: "lilac" },
  { icon: ShoppingBag, name: "Daily essentials", color: "mint" }
] as const;

const storefronts = [
  { initials: "MO", name: "Modern Originals", note: "Everyday style", color: "#f5b7a8" },
  { initials: "HL", name: "Happy Living", note: "Home favourites", color: "#ffd96a" },
  { initials: "NS", name: "Next Space", note: "Smart essentials", color: "#c9b8ff" }
] as const;

export function EcommerceLandingPage() {
  const { appInfo } = useEcommerceAppInfo();
  const profile = appInfo ?? ecommerceFallbackProfile;
  const initials = profile.brandName
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    document.title = `${profile.brandName} | Shop from local sellers`;
  }, [profile.brandName]);

  return (
    <div className="shop-public">
      <div className="shop-announcement">
        <Sparkles size={14} /> One marketplace. Many independent sellers. More to discover.
      </div>
      <header className="shop-nav">
        <a className="shop-brand" href="/" aria-label={`${profile.brandName} home`}>
          <span className="shop-brand-mark">{initials}</span>
          <span>{profile.brandName}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#categories">Categories</a>
          <a href="#stores">Stores</a>
          <a href="#benefits">Why shop here</a>
        </nav>
        <div className="shop-nav-tools">
          <button type="button" aria-label="Search">
            <Search size={19} />
          </button>
          <button type="button" aria-label="Wishlist">
            <Heart size={19} />
          </button>
          <a href="/app" aria-label="Open shopping desk">
            <ShoppingCart size={19} />
            <span>Shop</span>
          </a>
        </div>
      </header>

      <main>
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <div className="shop-kicker">
              <span>FRESH FINDS</span> FROM SELLERS YOU'LL LOVE
            </div>
            <h1>
              Everything good,
              <br />
              <em>all in one place.</em>
            </h1>
            <p>{profile.purpose}</p>
            <div className="shop-actions">
              <a className="shop-button shop-button-dark" href="/app">
                Start shopping <ArrowRight size={18} />
              </a>
              <a className="shop-button shop-button-quiet" href="#stores">
                Meet the sellers
              </a>
            </div>
            <div className="shop-mini-proof">
              <span>
                <Store size={18} /> Multi-vendor choice
              </span>
              <span>
                <PackageCheck size={18} /> One easy checkout
              </span>
              <span>
                <Truck size={18} /> Delivered to you
              </span>
            </div>
          </div>

          <div className="shop-hero-art" aria-label="Curated multi-vendor shopping illustration">
            <div className="shop-shape shop-shape-coral" />
            <div className="shop-shape shop-shape-purple" />
            <div className="shop-product-card shop-product-main">
              <span className="shop-product-tag">JUST IN</span>
              <div className="shop-tote">
                <span>{initials}</span>
              </div>
              <div>
                <strong>Made to be discovered</strong>
                <small>From independent sellers</small>
              </div>
            </div>
            <div className="shop-float-card shop-float-top">
              <BadgePercent size={21} />
              <span>
                <b>Good finds</b>
                <small>Fair prices</small>
              </span>
            </div>
            <div className="shop-float-card shop-float-bottom">
              <PackageCheck size={21} />
              <span>
                <b>One cart</b>
                <small>Many stores</small>
              </span>
            </div>
            <span className="shop-doodle shop-doodle-one">✦</span>
            <span className="shop-doodle shop-doodle-two">⌁</span>
          </div>
        </section>

        <section className="shop-categories" id="categories">
          <div className="shop-section-title">
            <div>
              <span>SHOP YOUR WAY</span>
              <h2>Find your kind of thing.</h2>
            </div>
            <a href="/app">
              Browse everything <ArrowRight size={17} />
            </a>
          </div>
          <div className="shop-category-grid">
            {categories.map(({ icon: Icon, name, color }) => (
              <a className={`shop-category shop-category-${color}`} href="/app" key={name}>
                <span>
                  <Icon size={31} />
                </span>
                <h3>{name}</h3>
                <ArrowRight size={18} />
              </a>
            ))}
          </div>
        </section>

        <section className="shop-stores" id="stores">
          <div className="shop-stores-copy">
            <span>THE PEOPLE BEHIND THE PRODUCTS</span>
            <h2>
              One cart.
              <br />A whole community.
            </h2>
            <p>
              Explore independent storefronts, collect favourites from different sellers, and bring
              it all together in one simple marketplace.
            </p>
            <a className="shop-text-link" href="/app">
              Explore all stores <ArrowRight size={17} />
            </a>
          </div>
          <div className="shop-store-stack">
            {storefronts.map((store, index) => (
              <article
                className="shop-store-card"
                key={store.name}
                style={
                  {
                    "--store-color": store.color,
                    "--store-shift": `${index * 12}px`
                  } as CSSProperties
                }
              >
                <div className="shop-store-avatar">{store.initials}</div>
                <div>
                  <h3>{store.name}</h3>
                  <p>{store.note}</p>
                </div>
                <span>
                  Visit <ArrowRight size={15} />
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="shop-benefits" id="benefits">
          <div>
            <ShoppingBag size={25} />
            <h3>More choice</h3>
            <p>Browse products from many storefronts in one destination.</p>
          </div>
          <div>
            <BadgePercent size={25} />
            <h3>Better discoveries</h3>
            <p>Find useful, interesting picks beyond the usual shelf.</p>
          </div>
          <div>
            <Truck size={25} />
            <h3>Simple delivery</h3>
            <p>A clear journey from your cart to your doorstep.</p>
          </div>
        </section>

        <section className="shop-cta">
          <div className="shop-cta-spark">✦</div>
          <span>YOUR NEXT FAVOURITE IS HERE</span>
          <h2>Go on. Take a look around.</h2>
          <a className="shop-button shop-button-light" href="/app">
            Enter the marketplace <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer className="shop-footer">
        <div className="shop-brand">
          <span className="shop-brand-mark">{initials}</span>
          <span>{profile.brandName}</span>
        </div>
        <p>{profile.tagline}</p>
        <a href="/app">
          Shop now <ArrowRight size={15} />
        </a>
      </footer>
    </div>
  );
}
