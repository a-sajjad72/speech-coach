"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Download, Trash2, MoreHorizontal } from "lucide-react"

interface CardSessionMenuProps {
    onExport: () => void
    onDelete: () => void
}

export function CardSessionMenu({ onExport, onDelete }: CardSessionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-purple-100">
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onExport()
                    }}
                    className="flex items-center cursor-pointer text-blue-600 hover:bg-blue-50"
                >
                    <Download className="h-4 w-4 mr-2" />
                    <span>Export Session</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="flex items-center cursor-pointer text-red-600 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Delete Session</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}