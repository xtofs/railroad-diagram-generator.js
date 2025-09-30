
# TODO


- [ ] make a proposal for a change of the specification that explains that:
    - an element is allowed to draw rails along its own bounding box's edge
    - an element is not allowed to draw rails along its children's bounding box's edges.
    - and element can end a horizontal rail on the connection point of a child (the points (0,baseline) and (widht,baseline))
    this ensures that rails don't interfere or overlap.

- [ ] what is the common practice in javascript node.js projects how classes should be saved to files: one-file one-file-per-type ?