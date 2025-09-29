
# TODO

- [x] can we add 1 pixel to the svg height and width to see the small lines of the pattern at the bottom and right?

- [x] to distinguish terminals from non-terminals even better it would be good we add double quotes around terminals that originally where written as double quoted string. For example add it to `0` since it appears as `"0"` in ABNF whereas `%x31-39` is a terminal that didn't have double quotes
Yet I am not sure where this decision should be made. It is probably the parsers responsibility and it coudl just pass the escaped double quotes along.

- [x] the stack layout gets the merging rails on the right wrong. they are starting too far on the right and have turn south instead of back up (north). a good example is the WS rule in json.abnf .
- [ ] the stack layout gets the branching rails on the left wrong. they overshoot a little bit and encroach on bounding box of their second and later children. i might acxtually be because the child elements are rendered to far to the left

- [ ] make a proposal for a change of the specification that explains that:
    - an element is allowed to draw rails along its own bounding box's edge
    - an element is not allowed to draw rails along its children's bounding box's edges.
    - and element can end a horizontal rail on the connection point of a child (the points (0,baseline) and (widht,baseline))
    this ensures that rails don't interfere or overlap.

