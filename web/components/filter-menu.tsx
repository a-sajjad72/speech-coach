"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

interface FilterMenuProps {
    selectedLanguages: string[]
    onLanguageChange: (language: string) => void
    availableLanguages: string[]
}

export function FilterMenu({ selectedLanguages, onLanguageChange, availableLanguages }: FilterMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full w-8 h-8 lg:w-10 lg:h-10"
                >
                    <Filter className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-purple-100">
                <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-gray-700 px-2">Filter by Language</p>
                </div>
                {availableLanguages.map((language) => (
                    <DropdownMenuCheckboxItem
                        key={language}
                        checked={selectedLanguages.includes(language)}
                        onCheckedChange={() => onLanguageChange(language)}
                        className="cursor-pointer"
                    >
                        {language}
                    </DropdownMenuCheckboxItem>
                ))}
                {selectedLanguages.length > 0 && (
                    <>
                        <div className="my-1 h-px bg-purple-100" />
                        <DropdownMenuItem
                            onClick={() => {
                                // Clear all filters by unchecking all
                                selectedLanguages.forEach((lang) => onLanguageChange(lang))
                            }}
                            className="text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                            Clear Filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}