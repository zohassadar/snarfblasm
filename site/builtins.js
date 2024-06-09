export const builtIns = {
    levelcolors: {
        filename: 'level_colors.ips',
        source: `; Creates patch for NES Tetris that overwrites the level palettes

; References for value to color:
; https://www.nesdev.org/wiki/PPU_palettes
; https://kirjava.xyz/tetris-level-colours/

; $30 = white

.patch $185d ; level 0
   .db $30,$21,$12      ; light blue, blue

.patch $1861 ; level 1
   .db $30,$29,$1A      ; light green, green

.patch $1865 ; level 2
   .db $30,$24,$14      ; light pink, pink

.patch $1869 ; level 3
   .db $30,$2A,$12      ; green, blue

.patch $186d ; level 4
   .db $30,$2B,$15      ; light green, pink

.patch $1871 ; level 5
   .db $30,$22,$2B      ; light purple, light green

.patch $1875 ; level 6
   .db $30,$00,$16      ; grey, red

.patch $1879 ; level 7
   .db $30,$05,$13      ; dark red, purple

.patch $187d ; level 8
   .db $30,$16,$12      ; red, blue

.patch $1881 ; level 9
   .db $30,$27,$16      ; orange, red
`,
    },
    nextbox: {
        filename: 'tetris_next_box_playfield.ips',
        source: `; by maya
; assembles with snarfblasm

tetriminoX = $40
tetriminoY = $41
fallTimer = $45
playState = $48
player1_tetriminoX = $60
player1_tetriminoY = $61


.patch $16fa
.org $96ea
vramPlayfieldRows:
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21d2, $21d2, $21d2
    .word $21d2, $21f2, $2212, $2232


.patch $6ff
.org $86ef
    ; @initStatsByType, after bne @initStatsByType
    lda #2
    sta player1_tetriminoX
    lda #16
    sta player1_tetriminoY
    lda #0

.patch $1777
.org $9767
    ldx #4 ; number of columns to draw

.patch $18a4
.org $9894
    ; playState_spawnNextTetrimino, after bmi @ret
    ldx #0
    stx fallTimer
    inx
    stx playState
    inx
    stx tetriminoX
    ldx #16
    stx tetriminoY
    jmp $98ca ; to ldx nextPiece

.patch $a20
    .db $c0 ; current piece x offset

.patch $a43
    .db $ef ; current piece y offset

.patch $be3
    .db $80 ; next piece x offset

.patch $be7
    .db $2f ; next piece y offset

.patch $4387
    .db %10101111 ; top of next box attribute table

.patch $4392
    .db %11111010 ; bottom of next box attribute table

.patch $1a9e
    .db 4 ; number of columns checked during line clear check

.patch $14ec
    .db 4 ; width of playfield (for valid piece position check)

.patch $180e
.org $97fe
leftColumns:
    .db 1, 0, 0, 0, 0
rightColumns:
    .db 2, 3, 3, 3, 3
`,
    },
    penguin: {
        filename: 'penguin_lineclear.ips',
        source: `BUTTON_START = $10

playState = $48
vramRow = $49
completedRow = $4a
rowY = $52
spriteXOffset = $a0
spriteYOffset = $a1
spriteIndexInOamContentLookup = $a2
generalCounter3 = $aa
frameCounter = $b1
oamStagingLength = $b3
sleepCounter = $c3
displayNextPiece = $df
newlyPressedButtons_player1 = $f5
effectiveRowY = $0605

PPUADDR = $2006
PPUDATA = $2007

loadSpriteIntoOamStaging = $8c27
vramPlayfieldRows = $96ea
updateAudioWaitForNmiAndResetOamStaging = $aa2f



.patch $0248
; .org $8238
        ; allows for skippable legal screen
        jsr     bailable_sleep_for_a_vblanks


; Penguins are copied from the B-Type Height 2 ending entity definitions
; Priority and palette are changed.  $21 -> $03
; https://www.nesdev.org/wiki/PPU_OAM

.patch $0df5
.org $8de5

; these replace a block of unused piece entity definitions
sprite0FPenguineLineClear1: ; $e5 8d
        .byte   $E8,$A9,$03,$00
        .byte   $E8,$AA,$03,$08
        .byte   $F0,$B8,$03,$F8
        .byte   $F0,$B9,$03,$00
        .byte   $F0,$BA,$03,$08
        .byte   $F8,$C9,$03,$00
        .byte   $F8,$CA,$03,$08
        .byte   $F8,$CB,$03,$10
        .byte   $00,$D9,$03,$00
        .byte   $00,$DA,$03,$08
        .byte   $FF

sprite10PenguineLineClear2: ; $0e 8e
        .byte   $E8,$AD,$03,$00
        .byte   $E8,$AE,$03,$08
        .byte   $F0,$BC,$03,$F8
        .byte   $F0,$BD,$03,$00
        .byte   $F0,$BE,$03,$08
        .byte   $F8,$CD,$03,$00
        .byte   $F8,$CE,$03,$08
        .byte   $F8,$CF,$03,$10
        .byte   $00,$DD,$03,$00
        .byte   $00,$DE,$03,$08
        .byte   $FF


.patch $0c9a
; .org $8c8a
        .word sprite0FPenguineLineClear1
        .word sprite10PenguineLineClear2


; colors for penguin in unused sprite palette index 03
.patch $2d22
; .org $ad12
    .byte   $0F,$0F,$20,$27


.patch $1af4
; .org $9ae4
        lda     #$00
        sta     vramRow
        jsr     setRowYBasedOnFrameCounter
        nop

.patch $1520
; .org $9510
        jsr    updateLineClearingAnimation



; Replaces what is labeled "unreferenced_data1"
.patch $56d9
.org $d6c9

updateLineClearingAnimation:
        ;   skip over first 32 bytes in oam staging to account for current/next pieces
        lda     #$20
        sta     oamStagingLength

        ;  Start on left side in fixed spot and have penguin take 17-20 steps depending on frameCounter
        ldx     effectiveRowY
        lda     penguinXOffset,x
        sta     spriteXOffset

        ; Figure out lowest row cleared and put penguin there
        ldx     #$03
nextRowToCheck:
        lda     completedRow,x
        bne     foundRow
        dex
        bpl     nextRowToCheck
foundRow:
        asl
        asl
        asl
        clc
        adc     #$2D
        sta     spriteYOffset
        lda     effectiveRowY
        and     #$01
        clc
        adc     #$0F
        sta     spriteIndexInOamContentLookup
        jsr     loadSpriteIntoOamStaging

; Clear block
        lda     effectiveRowY
        and     #$01
        bne     skipBlockClear
        sta     generalCounter3 ; Countup through all four rows (0,1,2,3)
whileCounter3LessThan4:
        ldy     generalCounter3
        lda     completedRow,y
        beq     nextRow       ; Skip row if no line clear
        asl                    ; Multiply by 2 to get second byte of address from table
        tay
        lda     vramPlayfieldRows+1,y  ; first byte of PPU address
        sta     PPUADDR
        lda     effectiveRowY           ; Divide by 2 to get row to clear
        ror
        clc
        adc     vramPlayfieldRows,y  ; Add to get 2nd byte of PPU address
        adc     #$05                 ; Offset to line up with 1 player screen
        sta     PPUADDR
        lda     #$FF                 ; blank tile
        sta     PPUDATA
nextRow:
        inc     generalCounter3
        lda     generalCounter3
        cmp     #$04
        bne     whileCounter3LessThan4

skipBlockClear:
        dec     effectiveRowY
        dec     rowY ; rowY used for timing
        bne     returnLineClear
        inc     playState
returnLineClear:
        rts

setRowYBasedOnFrameCounter:
        lda     frameCounter
        and     #$03
        tax
        lda     rowYValues,x
        sta     rowY ; use rowY to determine when to bail to line up with original rom timing
        lda     #$14
        sta     effectiveRowY ; use effectiveRowY to have penguin always start on left most side
        rts

bailable_sleep_for_a_vblanks:
        sta     sleepCounter
sleepLoop:
        jsr     updateAudioWaitForNmiAndResetOamStaging
        lda     newlyPressedButtons_player1
        and     #BUTTON_START
        bne     returnSleep
        lda     sleepCounter
        bne     sleepLoop
returnSleep:
        rts

; Total steps penguin will take based on frameCounter & 0x03
; This makes the timing line up with vanilla lineclear
rowYValues:
        .byte   $11,$14,$13,$12

; offsets to account for up to 20 steps
; First byte not used and serves as offset only
penguinXOffset:
        .byte   $00,$58,$5C,$60,$64,$68,$6C,$70
        .byte   $74,$78,$7C,$80,$84,$88,$8C,$90
        .byte   $94,$98,$9C,$A0,$A4
        `,
    },
    levelspeeds: {
        filename: 'level_speeds.ips',
        source: `; Creates patch that replaces frames per drop related information

.patch $0984
    .db 1      ; level 29+

.patch $099E
    .db 48     ; level 0
    .db 43     ; level 1
    .db 38     ; level 2
    .db 33     ; level 3
    .db 28     ; level 4
    .db 23     ; level 5
    .db 18     ; level 6
    .db 13     ; level 7
    .db 8      ; level 8
    .db 6      ; level 9
    .db 5      ; level 10
    .db 5      ; level 11
    .db 5      ; level 12
    .db 4      ; level 13
    .db 4      ; level 14
    .db 4      ; level 15
    .db 3      ; level 16
    .db 3      ; level 17
    .db 3      ; level 18
    .db 2      ; level 19
    .db 2      ; level 20
    .db 2      ; level 21
    .db 2      ; level 22
    .db 2      ; level 23
    .db 2      ; level 24
    .db 2      ; level 25
    .db 2      ; level 26
    .db 2      ; level 27
    .db 2      ; level 28
        `,
    },
};
