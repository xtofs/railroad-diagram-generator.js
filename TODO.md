
# TODO


- [ ] make a proposal for a change of the specification that explains that:
    - an element is allowed to draw tracks along its own bounding box's edge
    - an element is not allowed to draw tracks along its children's bounding box's edges.
    - and element can end a horizontal track on the connection point of a child (the points (0,baseline) and (widht,baseline))
    this ensures that tracks don't interfere or overlap.
