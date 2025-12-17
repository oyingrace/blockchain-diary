;; ------------------------------------------------------------
;; ONE WORD STORY v2 - Clarity Contract
;; - Unlimited number of words (no small fixed list cap)
;; - Each entry is:
;;     - id        : auto-incrementing uint
;;     - word      : (string-ascii 32)
;;     - sender    : principal
;;     - timestamp : uint
;;     - category  : (string-ascii 32), e.g. "general", "tech"
;; ------------------------------------------------------------

;; Error codes
(define-constant ERR-WORD-NOT-FOUND (err u300))

;; Default category used when caller does not provide one
;; or provides an empty string.
(define-constant DEFAULT-CATEGORY "general")

;; ------------------------------------------------------------
;; INTERNAL: Get current timestamp
;; For now this is a simple placeholder (u0). It is factored out
;; so it can be easily updated later if block time usage changes.
;; ------------------------------------------------------------
(define-private (get-now)
  u0
)

;; ------------------------------------------------------------
;; INTERNAL: Normalize category
;; - If the provided category is empty (zero-length), use DEFAULT-CATEGORY.
;; - Otherwise return the provided category unchanged.
;; ------------------------------------------------------------
(define-private (normalize-category (maybe-category (string-ascii 32)))
  (if (= (len maybe-category) u0)
      DEFAULT-CATEGORY
      maybe-category
  )
)

;; ------------------------------------------------------------
;; PUBLIC: Add a new word to the story
;; - word      : the one-word text (string-ascii 32)
;; - category  : optional category name; if empty, DEFAULT-CATEGORY is used
;; ------------------------------------------------------------
(define-public (add-word (word (string-ascii 32)) (category (string-ascii 32)))
  (let
    (
      (id (var-get next-word-id))
      (sender tx-sender)
      (time (get-now))
      (final-category (normalize-category category))
    )
    (begin
      ;; store the new word
      (map-set words
        { id: id }
        {
          word: word,
          sender: sender,
          timestamp: time,
          category: final-category
        }
      )
      ;; increment the next-word-id counter
      (var-set next-word-id (+ id u1))
      ;; return basic info about the new entry
      (ok
        {
          id: id,
          word: word,
          category: final-category,
          timestamp: time,
          sender: sender
        }
      )
    )
  )
)

;; ------------------------------------------------------------
;; READ-ONLY: Get a word by its id
;; - Returns the full stored entry for the given id.
;; - If no word exists for that id, returns ERR-WORD-NOT-FOUND.
;; ------------------------------------------------------------
(define-read-only (get-word (id uint))
  (let
    (
      (stored (map-get? words { id: id }))
    )
    (if (is-none stored)
        ERR-WORD-NOT-FOUND
        (ok (unwrap-panic stored))
    )
  )
)





;; ------------------------------------------------------------
;; DATA: Auto-incrementing ID counter for words
;; Starts at 0; each new word uses the current value, then increments.
;; ------------------------------------------------------------
(define-data-var next-word-id uint u0)

;; ------------------------------------------------------------
;; DATA: Storage for all words
;; Keyed by auto-incrementing id.
;; ------------------------------------------------------------
(define-map words
  {
    id: uint
  }
  {
    word: (string-ascii 32),     ;; the word itself
    sender: principal,           ;; who added it
    timestamp: uint,             ;; when it was added
    category: (string-ascii 32)  ;; e.g. "general", "tech"
  }
)


