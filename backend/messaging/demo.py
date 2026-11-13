def meri_lifespan():
    print("1. Subah: connect kiya")
    yield
    print("3. Raat: close kiya")


gen = meri_lifespan()

next(gen)  # yield tak chalao
print("2. App chal raha hai... requests le raha hai")
next(gen, None)  # yield ke baad se chalao
