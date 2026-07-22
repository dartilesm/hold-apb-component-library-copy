"use client";

import * as React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { iconSlotClass, spinnerClass } from "@dept/core/recipes";
import type { ButtonBaseContract } from "@dept/core/contracts";

import { Button as ButtonBase } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends Omit<React.ComponentProps<typeof ButtonBase>, keyof ButtonBaseContract>,
    ButtonBaseContract {
  /** Icon rendered before the button text */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the button text */
  rightIcon?: React.ReactNode;
}

function Button({
  className,
  children,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonBase
      className={cn(className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span data-icon="inline-start" className={iconSlotClass}>
          <LoaderCircleIcon className={spinnerClass} aria-hidden />
        </span>
      ) : (
        leftIcon && (
          <span data-icon="inline-start" className={iconSlotClass}>
            {leftIcon}
          </span>
        )
      )}
      {children}
      {rightIcon && (
        <span data-icon="inline-end" className={iconSlotClass}>
          {rightIcon}
        </span>
      )}
    </ButtonBase>
  );
}

export { Button };
