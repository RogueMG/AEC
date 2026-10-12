import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, Phone, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { contact, navItems } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const sectionIds = navItems.map((item) => item.href.slice(1));

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const active = useActiveSection(sectionIds) ?? "top";

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b bg-ink text-surface transition-[border-color] duration-300",
        scrolled ? "border-ink-line" : "border-transparent",
      )}
    >
      <div
        className={cn(
          "page flex items-center justify-between gap-6 transition-[height] duration-300",
          scrolled ? "h-16" : "h-(--spacing-header)",
        )}
      >
        <a href="#top" aria-label="Asiatic Engineering Co., home">
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = item.href === `#${active}`;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative block py-2 text-[0.9375rem] font-medium transition-colors duration-150 hover:text-surface",
                      isActive ? "text-surface" : "text-ink-muted",
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-0 -bottom-0.5 h-[3px] bg-signal"
                        transition={{ duration: duration.quick, ease: ease.out }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <a
            href={contact.mobile.href}
            className="hidden items-center gap-2 text-[0.9375rem] font-medium tabular-nums hover:text-signal xl:inline-flex"
          >
            <Phone className="size-4" aria-hidden />
            {contact.mobile.label}
          </a>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="#contact">Enquire now</a>
          </Button>

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="-mr-2 grid size-11 place-items-center lg:hidden"
              >
                <Menu className="size-6" aria-hidden />
              </button>
            </Dialog.Trigger>
            <AnimatePresence>
              {menuOpen && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild forceMount>
                    <motion.div
                      className="fixed inset-0 z-50 bg-ink/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: duration.quick }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild forceMount aria-describedby={undefined}>
                    <motion.div
                      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-ink text-surface sm:w-96"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ duration: duration.base, ease: ease.out }}
                    >
                      <div className="flex h-(--spacing-header) items-center justify-between px-gutter">
                        <Dialog.Title className="type-label text-ink-muted">Menu</Dialog.Title>
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            aria-label="Close menu"
                            className="-mr-2 grid size-11 place-items-center"
                          >
                            <X className="size-6" aria-hidden />
                          </button>
                        </Dialog.Close>
                      </div>

                      <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-gutter">
                        <ul>
                          {navItems.map((item, i) => (
                            <motion.li
                              key={item.href}
                              className="border-b border-ink-line"
                              initial={{ opacity: 0, x: 24 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: duration.base,
                                ease: ease.out,
                                delay: 0.08 + i * 0.04,
                              }}
                            >
                              <a
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="type-heading block py-4 hover:text-signal"
                              >
                                {item.label}
                              </a>
                            </motion.li>
                          ))}
                        </ul>
                      </nav>

                      <div className="grid gap-3 p-gutter">
                        <Button asChild>
                          <a href="#contact" onClick={() => setMenuOpen(false)}>
                            Enquire now
                          </a>
                        </Button>
                        <Button asChild variant="outline-on-ink">
                          <a href={contact.mobile.href}>
                            <Phone aria-hidden />
                            {contact.mobile.label}
                          </a>
                        </Button>
                      </div>
                      {/* The three signal colours close the panel, same order as the hero. */}
                      <div aria-hidden className="flex h-2">
                        <span className="flex-1 bg-coral" />
                        <span className="flex-1 bg-signal" />
                        <span className="flex-1 bg-teal" />
                      </div>
                    </motion.div>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}

export default Header;
