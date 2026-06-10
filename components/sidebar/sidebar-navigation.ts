import {
    Bolt,
    Building2,
    FileText,
    Info,
    LayoutDashboard,
    Locate,
    MessageSquare,
    ShieldCheck,
    User2,
    UserCog,
} from "lucide-react";

import { SidebarNavigation } from "./sidebar-types";

export const scopeSidebarNavigation: SidebarNavigation = {
    navMain: [
        {
            title: "Dashboard",
            url: "/scope/dashboard",
            icon: LayoutDashboard,
        },
    ],
    settings: {
        title: "Escopos",
        icon: FileText,
        items: [
            {
                title: "Lista",
                url: "/scope/list",
            },
            {
                title: "Clientes",
                url: "/scope/clients",
            },
            {
                title: "Meus Escopos",
                url: "/scope/my-scopes",
            },
        ],
    },
    action: {
        title: "Novo Escopo",
        url: "/scope/new",
    },
};

export const trackerSidebarNavigation: SidebarNavigation = {
    navMain: [
        {
            title: "Pipeline",
            url: "/tracker/pipeline",
            icon: Locate,
        },
    ],
};

export const settingsSidebarNavigation: SidebarNavigation = {
    navMain: [
        {
            title: "Geral",
            url: "/settings/general",
            icon: Bolt,
        },
        {
            title: "Usuários",
            url: "/settings/users",
            icon: User2,
        },
        {
            title: "Prepostos",
            url: "/settings/prepostos",
            icon: UserCog,
        },
        {
            title: "Minha organização",
            url: "/settings/organization",
            icon: Building2,
        },
        {
            title: "Controle de acesso",
            url: "/settings/tools-access",
            icon: ShieldCheck,
        },
    ],
};

export const processSidebarNavigation: SidebarNavigation = {
    navMain: [
        {
            title: "Informações do processo",
            url: "",
            icon: Info,
        },
        {
            title: "Comentários",
            url: `${""}#comentarios`,
            icon: MessageSquare,
        },
    ],
    settings: {
        title: "Departamentos",
        icon: Building2,
        items: [
            {
                title: "Despacho aduaneiro",
                url: `${""}#departamento-despacho-aduaneiro`,
            },
            {
                title: "Frete internacional",
                url: `${""}#departamento-frete-internacional`,
            },
            {
                title: "Frete Rodoviário",
                url: `${""}#departamento-frete-rodoviario`,
            },
            {
                title: "Financeiro",
                url: `${""}#departamento-financeiro`,
            },
        ],
    },
    action: {
        title: "Novo Processo",
        url: "/tracker/process/new",
    },
};