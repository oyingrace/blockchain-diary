;; ------------------------------------------------------------
;; STORY MANAGEMENT Clarity 4 Contract
;; Manages multiple stories: create, list, complete, archive
;; Each story has metadata: title, description, status, etc.
;; ------------------------------------------------------------

;; Error codes
(define-constant ERR-STORY-NOT-FOUND (err u200))
(define-constant ERR-STORY-ALREADY-COMPLETE (err u201))
(define-constant ERR-STORY-ALREADY-ARCHIVED (err u202))
(define-constant ERR-INVALID-TITLE (err u203))

;; Data store for all stories
;; Maps story ID (uint) to story metadata
(define-map stories { 
    id: uint,
    title: (string-ascii 100),
    description: (string-ascii 500),
    creator: principal,
    created-at: uint,
    status: (string-ascii 20),  ;; "active", "complete", "archived"
    word-count: uint
})

;; Counter for generating unique story IDs
(define-data-var next-story-id uint u1)

