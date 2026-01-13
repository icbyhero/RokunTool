/**
 * AlertDialog UI Component
 *
 * 用于显示需要用户确认的对话框
 */

import * as React from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'

export interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function AlertDialog({
  open,
  onOpenChange,
  children
}: AlertDialogProps): React.JSX.Element {
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any)
        }
        return child
      })}
    </>
  )
}

export interface AlertDialogContentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function AlertDialogContent({
  open,
  onOpenChange,
  children
}: AlertDialogContentProps): React.JSX.Element | null {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export interface AlertDialogHeaderProps {
  children: React.ReactNode
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps): React.JSX.Element {
  return <div className="mb-4">{children}</div>
}

export interface AlertDialogTitleProps {
  children: React.ReactNode
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps): React.JSX.Element {
  return <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{children}</h2>
}

export interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

export function AlertDialogDescription({
  children
}: AlertDialogDescriptionProps): React.JSX.Element {
  return <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{children}</p>
}

export interface AlertDialogFooterProps {
  children: React.ReactNode
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps): React.JSX.Element {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}

export interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

export function AlertDialogAction({
  children,
  onClick,
  disabled = false,
  variant = 'default'
}: AlertDialogActionProps): React.JSX.Element {
  return (
    <Button onClick={onClick} disabled={disabled} variant={variant}>
      {children}
    </Button>
  )
}

export interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function AlertDialogCancel({
  children,
  onClick,
  disabled = false
}: AlertDialogCancelProps): React.JSX.Element {
  return (
    <Button onClick={onClick} disabled={disabled} variant="outline">
      {children}
    </Button>
  )
}
