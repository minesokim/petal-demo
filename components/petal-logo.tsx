"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Animated Petal mark — five petals as separate paths so each blooms in
 * independently (staggered scale + rotate), with a 72° fifth-turn on hover.
 * Inherits color via `currentColor`; size via `className` (e.g. "size-6").
 *
 * <PetalLogo className="size-6" />                 // blooms on mount, spins on hover
 * <PetalLogo className="size-5" bloom={false} />   // static (e.g. inline in text)
 * <PetalLogo className="size-8" spinOnHover={false} />
 * <PetalLogo className="size-7" loading />         // continuous premium "thinking" loop
 *
 * Honors prefers-reduced-motion automatically (renders static).
 */
const PETALS = [
  "M 455 223 L 428 233 L 414 241 L 398 253 L 378 273 L 358 302 L 343 338 L 338 363 L 337 391 L 343 427 L 354 456 L 375 491 L 405 524 L 432 547 L 475 576 L 504 590 L 522 596 L 539 599 L 561 597 L 574 591 L 581 585 L 588 575 L 597 552 L 602 525 L 604 501 L 604 458 L 599 422 L 587 370 L 573 327 L 559 293 L 543 264 L 531 248 L 513 232 L 493 223 L 481 221 Z",
  "M 900 228 L 879 217 L 858 212 L 826 213 L 802 220 L 771 236 L 737 262 L 715 284 L 687 319 L 666 352 L 650 383 L 637 415 L 626 454 L 622 484 L 623 529 L 629 554 L 636 567 L 644 575 L 649 578 L 660 581 L 670 581 L 685 578 L 711 567 L 735 552 L 782 516 L 841 465 L 891 416 L 913 389 L 922 375 L 931 357 L 936 343 L 940 324 L 941 304 L 937 280 L 926 255 L 917 243 Z",
  "M 694 602 L 677 622 L 672 632 L 669 647 L 671 663 L 682 687 L 700 710 L 737 746 L 801 801 L 843 833 L 871 850 L 892 858 L 909 861 L 929 860 L 943 856 L 967 842 L 983 827 L 996 811 L 1013 783 L 1027 749 L 1033 726 L 1036 706 L 1036 672 L 1031 646 L 1019 617 L 1006 598 L 989 581 L 981 575 L 949 557 L 922 548 L 880 542 L 846 543 L 800 551 L 759 564 L 725 580 L 709 590 Z",
  "M 632 692 L 615 693 L 597 703 L 581 723 L 568 748 L 556 782 L 550 804 L 543 839 L 538 883 L 538 931 L 540 949 L 545 972 L 553 992 L 560 1003 L 578 1019 L 593 1025 L 612 1028 L 635 1027 L 664 1021 L 691 1011 L 711 1001 L 728 990 L 738 982 L 758 961 L 769 943 L 775 927 L 777 917 L 777 889 L 772 865 L 761 836 L 751 816 L 737 793 L 713 759 L 692 734 L 674 716 L 653 700 L 643 695 Z",
  "M 551 632 L 538 623 L 524 616 L 497 606 L 460 598 L 422 595 L 376 597 L 341 603 L 304 614 L 276 628 L 260 640 L 251 649 L 241 663 L 232 682 L 225 711 L 224 734 L 228 766 L 235 790 L 250 821 L 263 839 L 285 860 L 313 876 L 336 883 L 352 885 L 369 885 L 389 882 L 417 873 L 447 857 L 477 834 L 510 800 L 540 759 L 557 728 L 568 698 L 571 681 L 571 666 L 565 648 Z",
];

export function PetalLogo({
  className,
  bloom = true,
  spinOnHover = true,
  loading = false,
  title,
}: {
  className?: string;
  bloom?: boolean;
  spinOnHover?: boolean;
  loading?: boolean;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const animateIn = bloom && !reduce;
  const spin = spinOnHover && !reduce;
  const loop = loading && !reduce;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1254 1254"
      fill="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      style={{ transformOrigin: "50% 50%" }}
      // loading → slow continuous turn; otherwise bloom in (and flip on hover)
      initial={animateIn && !loop ? "hidden" : false}
      animate={loop ? { rotate: 360 } : "show"}
      whileHover={spin && !loop ? { rotate: 72 } : undefined}
      transition={
        loop
          ? { rotate: { duration: 6, repeat: Infinity, ease: "linear" } }
          : { rotate: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
      }
      variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}
    >
      {title ? <title>{title}</title> : null}
      {PETALS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          {...(loop
            ? {
                // premium "breathing bloom" — petals pulse in a staggered wave
                animate: { scale: [1, 0.4, 1], opacity: [1, 0.3, 1] },
                transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.14 },
              }
            : {
                variants: {
                  hidden: { scale: 0, opacity: 0, rotate: -45 },
                  show: { scale: 1, opacity: 1, rotate: 0 },
                },
                transition: { type: "spring", stiffness: 520, damping: 18 },
              })}
        />
      ))}
    </motion.svg>
  );
}
