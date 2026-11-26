# Reference View for Safelight

A [Safelight](https://github.com/anthonyreimche/SafeLight) extension that pins
a reference photo beside the one you're editing in Develop, so a set of photos
can be brought to one look by eye.

Needs Safelight 3.2.8 or later.

## How to use it

- In Develop, press **Reference** in the bottom bar, or **Shift+R**. The
  first time, the open photo becomes the reference. Move on to another photo
  and the reference stays beside it.
- To pick another reference, right-click a photo in the Library or the
  Filmstrip and choose **Use as reference photo**.
- The pane's header names the reference. Its buttons put the reference
  beside or above the photo you're editing (above suits two landscape
  photos), and close it. Shift+R brings the same reference back.

The reference shows with its saved edit and follows it: change the reference
photo itself and the pane catches up once the edit is stored.

## Matching colours to the reference

With [Colour Mapping](https://github.com/anthonyreimche/Colour-Mapping) 1.1.0
or later installed, its panel offers **Match to reference** while a reference
shows. It analyses the reference as the colour source and matches the open
photo to it, as one undo step.

Other extensions can do the same: while a reference shows, the shared variable
`reference.photo` holds `{ photoId, name }`, and `null` otherwise.

## Licence

GPL-3.0-only.

## Development

```
npm run check       # typecheck, build, unit tests
```
