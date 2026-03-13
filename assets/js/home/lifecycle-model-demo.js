const { createApp, reactive, computed, watch } = Vue;

const STORAGE_KEY = "lifecycle-model-demo";

const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_MODEL = {
  product: {
    name: "涤纶纱线",
    model: "PF-2026",
    functionalUnit: "1 Piece(s)",
    quantity: 1,
    unit: "kg",
  },
  stages: [
    {
      id: "raw",
      name: "原料获取",
      inputs: [
        {
          id: createId("input"),
          category: "原材料",
          name: "再生 PET 切片",
          quantity: 1.02,
          unit: "kg",
          source: "采购台账",
          note: "",
          certificateName: "",
          factor: {
            name: "聚对苯二甲酸乙二醇酯（rPET）",
            value: 2.31,
            unit: "kg CO2-eq/kg",
            region: "CN",
            owner: "CPCD",
          },
          transport: {
            required: true,
            routes: [
              {
                id: createId("route"),
                name: "PET 切片运输",
                weight: 1.02,
                from: "苏州",
                to: "无锡",
                distance: 186,
                mode: "公路运输",
                factor: {
                  name: "transport, freight, lorry 16-32 metric ton",
                  value: 0.168342,
                  unit: "kg CO2-eq/t*km",
                  region: "RoW",
                  owner: "Ecoinvent",
                },
              },
            ],
          },
        },
        {
          id: createId("input"),
          category: "运输",
          name: "公路运输",
          quantity: 186,
          unit: "km",
          source: "物流系统",
          note: "",
          certificateName: "",
          factor: {
            name: "transport, freight, lorry 16-32 metric ton",
            value: 0.168342,
            unit: "kg CO2-eq/t*km",
            region: "RoW",
            owner: "Ecoinvent",
          },
          transport: {
            required: false,
            routes: [],
          },
        },
      ],
      processes: [
        { id: createId("process"), name: "原料预处理", outputName: "预处理切片", quantity: 1.0, unit: "kg", note: "含筛分和干燥" },
      ],
      outputs: [
        {
          id: createId("output"),
          category: "固废",
          name: "筛杂固废",
          quantity: 0.01,
          unit: "kg",
          source: "人工估算",
          note: "",
          certificateName: "",
          factor: {
            name: "waste treatment, municipal incineration",
            value: 0.91,
            unit: "kg CO2-eq/kg",
            region: "CN",
            owner: "CPCD",
          },
          transport: {
            required: false,
            routes: [],
          },
        },
      ],
    },
    {
      id: "production",
      name: "生产",
      inputs: [
        { id: createId("input"), category: "能源", name: "电网电力", quantity: 96.272, unit: "kWh", source: "电表抄表", note: "", certificateName: "", factor: { name: "market for electricity, medium voltage", value: 0.578, unit: "kg CO2-eq/kWh", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
        { id: createId("input"), category: "资源", name: "自来水", quantity: 0.113, unit: "t", source: "水表抄表", note: "", certificateName: "", factor: { name: "tap water production", value: 0.42, unit: "kg CO2-eq/t", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
        { id: createId("input"), category: "能源", name: "柴油", quantity: 2.116, unit: "kg", source: "能源台账", note: "", certificateName: "", factor: { name: "diesel combustion", value: 3.2, unit: "kg CO2-eq/kg", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
      ],
      processes: [
        { id: createId("process"), name: "纺丝阶段", outputName: "纱线半成品", quantity: 109.06, unit: "kg", note: "主工序，可继续拆分卷绕、加捻等子工序" },
        { id: createId("process"), name: "后整理阶段", outputName: "成品纱线", quantity: 108.4, unit: "kg", note: "示例中用第二道工序表达串行生产" },
      ],
      outputs: [
        { id: createId("output"), category: "废水", name: "废水 COD", quantity: 0.112, unit: "m3", source: "污水监测", note: "", certificateName: "", factor: { name: "wastewater treatment, COD", value: 0.72, unit: "kg CO2-eq/m3", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
        { id: createId("output"), category: "废水", name: "废水 BOD", quantity: 0.112, unit: "m3", source: "污水监测", note: "", certificateName: "", factor: { name: "wastewater treatment, BOD", value: 0.63, unit: "kg CO2-eq/m3", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
        { id: createId("output"), category: "固废", name: "固体废物", quantity: 0.279, unit: "kg", source: "危废台账", note: "", certificateName: "", factor: { name: "solid waste disposal", value: 0.91, unit: "kg CO2-eq/kg", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
      ],
    },
    {
      id: "packaging",
      name: "包装",
      inputs: [
        { id: createId("input"), category: "包装", name: "纸箱", quantity: 0.12, unit: "kg", source: "BOM", note: "", certificateName: "", factor: { name: "corrugated board box", value: 1.12, unit: "kg CO2-eq/kg", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
        { id: createId("input"), category: "包装", name: "缠绕膜", quantity: 0.03, unit: "kg", source: "BOM", note: "", certificateName: "", factor: { name: "plastic film", value: 2.04, unit: "kg CO2-eq/kg", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
      ],
      processes: [
        { id: createId("process"), name: "包装工序", outputName: "包装成品", quantity: 108.55, unit: "kg", note: "" },
      ],
      outputs: [],
    },
    {
      id: "distribution",
      name: "分销",
      inputs: [
        { id: createId("input"), category: "运输", name: "柴油货车运输", quantity: 580, unit: "km", source: "物流系统", note: "", certificateName: "", factor: { name: "transport, freight, lorry 16-32 metric ton", value: 0.168342, unit: "kg CO2-eq/t*km", region: "RoW", owner: "Ecoinvent" }, transport: { required: true, routes: [{ id: createId("route"), name: "成品发运", weight: 108.55, from: "无锡", to: "南京", distance: 580, mode: "公路运输", factor: { name: "transport, freight, lorry 16-32 metric ton", value: 0.168342, unit: "kg CO2-eq/t*km", region: "RoW", owner: "Ecoinvent" } }] } },
      ],
      processes: [
        { id: createId("process"), name: "运输至客户仓", outputName: "已交付产品", quantity: 108.55, unit: "kg", note: "可继续增加仓储、装卸等工序" },
      ],
      outputs: [],
    },
    {
      id: "use",
      name: "使用",
      inputs: [
        { id: createId("input"), category: "能源", name: "客户端用电", quantity: 8.4, unit: "kWh", source: "场景估算", note: "", certificateName: "", factor: { name: "use phase electricity", value: 0.578, unit: "kg CO2-eq/kWh", region: "CN", owner: "CPCD" }, transport: { required: false, routes: [] } },
      ],
      processes: [
        { id: createId("process"), name: "产品使用阶段", outputName: "使用后的产品", quantity: 1, unit: "piece", note: "" },
      ],
      outputs: [],
    },
    {
      id: "end",
      name: "废弃处理",
      inputs: [
        { id: createId("input"), category: "运输", name: "回收运输", quantity: 65, unit: "km", source: "场景估算", note: "", certificateName: "", factor: { name: "transport, freight, lorry 16-32 metric ton", value: 0.168342, unit: "kg CO2-eq/t*km", region: "RoW", owner: "Ecoinvent" }, transport: { required: true, routes: [{ id: createId("route"), name: "回收运输", weight: 1, from: "南京", to: "苏州", distance: 65, mode: "公路运输", factor: { name: "transport, freight, lorry 16-32 metric ton", value: 0.168342, unit: "kg CO2-eq/t*km", region: "RoW", owner: "Ecoinvent" } }] } },
      ],
      processes: [
        { id: createId("process"), name: "回收与处置", outputName: "处置完成", quantity: 1, unit: "piece", note: "" },
      ],
      outputs: [
        { id: createId("output"), category: "副产物", name: "回收料", quantity: 0.18, unit: "kg", source: "回收商数据", note: "", certificateName: "", factor: { name: "recycled material credit", value: -0.42, unit: "kg CO2-eq/kg", region: "CN", owner: "自定义" }, transport: { required: false, routes: [] } },
      ],
    },
  ],
};

function createDefaultFactor(type, category) {
  if (type === "output") {
    return {
      name: "waste treatment factor",
      value: 0.91,
      unit: "kg CO2-eq/kg",
      region: "CN",
      owner: "CPCD",
    };
  }

  const unitMap = {
    能源: "kg CO2-eq/kWh",
    运输: "kg CO2-eq/t*km",
    资源: "kg CO2-eq/t",
  };

  return {
    name: `${category || "原材料"}影响因子`,
    value: 1.23,
    unit: unitMap[category] || "kg CO2-eq/kg",
    region: "CN",
    owner: "CPCD",
  };
}

function createEmptyRoute() {
  return {
    id: createId("route"),
    name: "",
    weight: 0,
    from: "",
    to: "",
    distance: 0,
    mode: "公路运输",
    factor: {
      name: "transport, freight, lorry 16-32 metric ton",
      value: 0.168342,
      unit: "kg CO2-eq/t*km",
      region: "RoW",
      owner: "Ecoinvent",
    },
  };
}

const createEditorState = () => ({
  visible: false,
  mode: "create",
  type: "input",
  title: "",
  stageId: "",
  stageName: "",
  targetId: "",
  currentTab: "basic",
  form: {
    category: "原材料",
    name: "",
    quantity: 0,
    unit: "kg",
    source: "",
    note: "",
    outputName: "",
    certificateName: "",
    factor: createDefaultFactor("input", "原材料"),
    transport: {
      required: false,
      routes: [],
    },
  },
});

function loadModel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(DEFAULT_MODEL);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.stages)) {
      return clone(DEFAULT_MODEL);
    }
    return parsed;
  } catch (error) {
    return clone(DEFAULT_MODEL);
  }
}

createApp({
  setup() {
    const model = reactive(loadModel());
    const editor = reactive(createEditorState());

    const stageCount = computed(() => model.stages.length);

    const totalNodeCount = computed(() =>
      model.stages.reduce(
        (count, stage) => count + stage.inputs.length + stage.processes.length + stage.outputs.length,
        0
      )
    );

    const totalOutputQuantity = computed(() =>
      model.stages.reduce((sum, stage) => {
        const stageOutput = stage.processes.reduce(
          (processSum, process) => processSum + Number(process.quantity || 0),
          0
        );
        return sum + stageOutput;
      }, 0)
    );

    const isItemEditor = computed(() => editor.type !== "process");

    const currentRoute = computed(() => {
      if (!editor.form.transport || !editor.form.transport.routes.length) {
        return null;
      }
      return editor.form.transport.routes[0];
    });

    watch(
      model,
      (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      },
      { deep: true }
    );

    function formatNumber(value) {
      const number = Number(value || 0);
      if (Number.isNaN(number)) {
        return "0";
      }
      return Number.isInteger(number) ? `${number}` : number.toFixed(3).replace(/\.?0+$/, "");
    }

    function findStage(stageId) {
      return model.stages.find((stage) => stage.id === stageId);
    }

    function findCollection(stage, type) {
      if (!stage) {
        return [];
      }
      if (type === "input") {
        return stage.inputs;
      }
      if (type === "output") {
        return stage.outputs;
      }
      return stage.processes;
    }

    function getStageProcessLabel(stageId) {
      const stage = findStage(stageId);
      if (!stage) {
        return "";
      }
      return stage.processes[0]?.name || stage.name;
    }

    function resetEditorForm(type) {
      editor.form.category = type === "output" ? "废气" : "原材料";
      editor.form.name = "";
      editor.form.quantity = 0;
      editor.form.unit = type === "process" ? model.product.unit : "kg";
      editor.form.source = "";
      editor.form.note = "";
      editor.form.outputName = "";
      editor.form.certificateName = "";
      editor.form.factor = createDefaultFactor(type, editor.form.category);
      editor.form.transport = {
        required: false,
        routes: [],
      };
      editor.currentTab = "basic";
    }

    function openCreateEditor(stageId, type) {
      const stage = findStage(stageId);
      resetEditorForm(type);
      editor.visible = true;
      editor.mode = "create";
      editor.type = type;
      editor.currentTab = "basic";
      editor.stageId = stageId;
      editor.stageName = stage ? stage.name : "";
      editor.targetId = "";
      editor.title =
        type === "process"
          ? `新增工序 - ${editor.stageName}`
          : `新增${type === "input" ? "输入" : "输出"} - ${editor.stageName}`;
    }

    function openEditEditor(stageId, type, targetId) {
      const stage = findStage(stageId);
      const collection = findCollection(stage, type);
      const target = collection.find((item) => item.id === targetId);
      if (!stage || !target) {
        return;
      }

      editor.visible = true;
      editor.mode = "edit";
      editor.type = type;
      editor.currentTab = "basic";
      editor.stageId = stageId;
      editor.stageName = stage.name;
      editor.targetId = targetId;
      editor.title =
        type === "process"
          ? `编辑工序 - ${stage.name}`
          : `编辑${type === "input" ? "输入" : "输出"} - ${stage.name}`;

      editor.form.category = target.category || (type === "output" ? "废气" : "原材料");
      editor.form.name = target.name || "";
      editor.form.quantity = target.quantity || 0;
      editor.form.unit = target.unit || "kg";
      editor.form.source = target.source || "";
      editor.form.note = target.note || "";
      editor.form.outputName = target.outputName || "";
      editor.form.certificateName = target.certificateName || "";
      editor.form.factor = clone(target.factor || createDefaultFactor(type, target.category));
      editor.form.transport = clone(
        target.transport || {
          required: false,
          routes: [],
        }
      );
    }

    function autoOpenFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const openType = params.get("open");
      if (!openType || !["input", "output", "process"].includes(openType)) {
        return;
      }

      const stageId = params.get("stage") || model.stages[0]?.id;
      const stage = findStage(stageId) || model.stages[0];
      if (!stage) {
        return;
      }

      const collection = findCollection(stage, openType);
      const index = Number(params.get("index") || 0);
      const target = collection[index] || collection[0];

      if (target) {
        openEditEditor(stage.id, openType, target.id);
      } else {
        openCreateEditor(stage.id, openType);
      }

      const tab = params.get("tab");
      if (tab === "basic" || tab === "transport") {
        editor.currentTab = tab;
      }
    }

    function closeEditor() {
      Object.assign(editor, createEditorState());
    }

    function setEditorTab(tab) {
      editor.currentTab = tab;
    }

    function setTransportRequired(required) {
      editor.form.transport.required = required;
      if (required && editor.form.transport.routes.length === 0) {
        editor.form.transport.routes.push(createEmptyRoute());
      }
      if (!required) {
        editor.form.transport.routes = [];
      }
    }

    function ensureFirstRoute() {
      if (!editor.form.transport.routes.length) {
        editor.form.transport.routes.push(createEmptyRoute());
      }
      return editor.form.transport.routes[0];
    }

    function applyMockFactor(scope) {
      if (scope === "transport") {
        const route = ensureFirstRoute();
        route.factor = {
          name: "transport, freight, lorry 16-32 metric ton",
          value: 0.168342,
          unit: "kg CO2-eq/t*km",
          region: "RoW",
          owner: "Ecoinvent",
        };
        return;
      }

      editor.form.factor = createDefaultFactor(editor.type, editor.form.category);
    }

    function saveEditor() {
      const stage = findStage(editor.stageId);
      const collection = findCollection(stage, editor.type);
      if (!stage || !collection) {
        return;
      }

      const commonPayload = {
        name: editor.form.name.trim(),
        quantity: Number(editor.form.quantity || 0),
        unit: editor.form.unit.trim(),
        note: editor.form.note.trim(),
      };

      if (!commonPayload.name || !commonPayload.unit) {
        window.alert("请先填写完整名称和单位。");
        return;
      }

      if (editor.type === "process" && !editor.form.outputName.trim()) {
        window.alert("请填写产出物名称。");
        return;
      }

      const payload =
        editor.type === "process"
          ? {
              id: editor.targetId || createId("process"),
              ...commonPayload,
              outputName: editor.form.outputName.trim(),
            }
          : {
              id: editor.targetId || createId(editor.type),
              ...commonPayload,
              category: editor.form.category,
              source: editor.form.source.trim(),
              certificateName: editor.form.certificateName.trim(),
              factor: clone(editor.form.factor),
              transport: clone(editor.form.transport),
            };

      if (editor.mode === "edit") {
        const targetIndex = collection.findIndex((item) => item.id === editor.targetId);
        if (targetIndex !== -1) {
          collection[targetIndex] = payload;
        }
      } else {
        collection.push(payload);
      }

      closeEditor();
    }

    function removeEditorItem() {
      const stage = findStage(editor.stageId);
      const collection = findCollection(stage, editor.type);
      const targetIndex = collection.findIndex((item) => item.id === editor.targetId);
      if (targetIndex === -1) {
        return;
      }

      const confirmed = window.confirm("确定删除当前节点吗？");
      if (!confirmed) {
        return;
      }

      collection.splice(targetIndex, 1);
      closeEditor();
    }

    function resetModel() {
      const confirmed = window.confirm("确定恢复到示例数据吗？当前修改会被覆盖。");
      if (!confirmed) {
        return;
      }

      const fresh = clone(DEFAULT_MODEL);
      model.product = fresh.product;
      model.stages.splice(0, model.stages.length, ...fresh.stages);
      closeEditor();
    }

    async function copyModelJson() {
      const json = JSON.stringify(model, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        window.alert("模型 JSON 已复制到剪贴板。");
      } catch (error) {
        window.prompt("当前环境不支持自动复制，请手动复制下面内容：", json);
      }
    }

    autoOpenFromQuery();

    return {
      model,
      editor,
      stageCount,
      totalNodeCount,
      totalOutputQuantity,
      isItemEditor,
      currentRoute,
      formatNumber,
      getStageProcessLabel,
      openCreateEditor,
      openEditEditor,
      closeEditor,
      setEditorTab,
      setTransportRequired,
      applyMockFactor,
      saveEditor,
      removeEditorItem,
      resetModel,
      copyModelJson,
    };
  },
}).mount("#app");
