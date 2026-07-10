"use client";

import * as React from "react";
import { LoaderCircleIcon } from "lucide-react";

import { Button as ButtonBase } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ComponentProps<typeof ButtonBase> {
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
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
        <span data-icon="inline-start" className="ui:contents">
          <LoaderCircleIcon className="ui:animate-spin" aria-hidden />
        </span>
      ) : (
        leftIcon && (
          <span data-icon="inline-start" className="ui:contents">
            {leftIcon}
          </span>
        )
      )}
      {children}
      {rightIcon && (
        <span data-icon="inline-end" className="ui:contents">
          {rightIcon}
        </span>
      )}
    </ButtonBase>
  );
}

export { Button };
