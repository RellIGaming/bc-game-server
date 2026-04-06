import prisma from "../prisma.js";

export const getSidebarMenu = async (req, res) => {
  try {
    const menus = await prisma.sidebarMenu.findMany({
      where: { isActive: true },
      orderBy: [
        { section: "asc" },
        { sortOrder: "asc" }
      ]
    });

    const map = {};
    const result = [];

    menus.forEach(menu => {
      map[menu.id] = { ...menu, submenu: [] };
    });

    menus.forEach(menu => {
      if (menu.parentId) {
        map[menu.parentId].submenu.push(map[menu.id]);
      } else {
        result.push(map[menu.id]);
      }
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const createMenuItem = async (req, res) => {
  try {
    const {
      parentId,
      menuKey,
      label,
      path,
      icon,
      section,
      hasSubmenu,
      sortOrder
    } = req.body;

    const menu = await prisma.sidebarMenu.create({
      data: {
        parentId: parentId || null,
        menuKey,
        label,
        path,
        icon,
        section,
        hasSubmenu: hasSubmenu || false,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json(menu);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await prisma.sidebarMenu.update({
      where: { id: Number(id) },
      data: req.body
    });

    res.json(menu);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteMenuItem = async (req, res) => {
  try {
    await prisma.sidebarMenu.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Menu deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};